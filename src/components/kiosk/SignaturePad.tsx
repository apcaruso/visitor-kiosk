import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type SignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  toBlob: () => Promise<Blob>;
};

type SignaturePadProps = {
  label: string;
  valueDataUrl: string;
  onChange: (value: string) => void;
  error?: string;
};

function drawImageToCanvas(canvas: HTMLCanvasElement, imageSource: string) {
  if (!imageSource) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const image = new Image();
  image.onload = () => {
    const width = canvas.width / Math.max(window.devicePixelRatio || 1, 1);
    const height = canvas.height / Math.max(window.devicePixelRatio || 1, 1);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
  };
  image.src = imageSource;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ label, valueDataUrl, onChange, error }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const drawingRef = useRef(false);
    const hasInkRef = useRef(Boolean(valueDataUrl));
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const currentDataUrlRef = useRef(valueDataUrl);
    const [isReady, setIsReady] = useState(false);

    function configureCanvas() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        return;
      }

      const previousImage = currentDataUrlRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = Math.floor(container.clientWidth);
      const height = Math.floor(container.clientHeight);

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 3.5;
      context.strokeStyle = "#111827";
      context.fillStyle = "#ffffff";
      context.clearRect(0, 0, width, height);
      context.fillRect(0, 0, width, height);

      if (previousImage) {
        drawImageToCanvas(canvas, previousImage);
      }

      setIsReady(true);
    }

    useEffect(() => {
      configureCanvas();
      window.addEventListener("resize", configureCanvas);
      return () => {
        window.removeEventListener("resize", configureCanvas);
      };
    }, []);

    useEffect(() => {
      currentDataUrlRef.current = valueDataUrl;
      hasInkRef.current = Boolean(valueDataUrl);

      const canvas = canvasRef.current;
      if (!canvas || !isReady) {
        return;
      }

      if (!valueDataUrl) {
        const context = canvas.getContext("2d");
        if (!context) {
          return;
        }

        const width = canvas.width / Math.max(window.devicePixelRatio || 1, 1);
        const height = canvas.height / Math.max(window.devicePixelRatio || 1, 1);
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        return;
      }

      drawImageToCanvas(canvas, valueDataUrl);
    }, [isReady, valueDataUrl]);

    function getCoordinates(event: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current;
      if (!canvas) {
        return { x: 0, y: 0 };
      }

      const rectangle = canvas.getBoundingClientRect();

      return {
        x: event.clientX - rectangle.left,
        y: event.clientY - rectangle.top,
      };
    }

    function commitSignature() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      currentDataUrlRef.current = canvas.toDataURL("image/png");
      onChange(currentDataUrlRef.current);
    }

    function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) {
        return;
      }

      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      drawingRef.current = true;
      const coordinates = getCoordinates(event);
      lastPointRef.current = coordinates;
      hasInkRef.current = true;

      context.beginPath();
      context.moveTo(coordinates.x, coordinates.y);
      context.lineTo(coordinates.x + 0.01, coordinates.y + 0.01);
      context.stroke();
    }

    function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!drawingRef.current || !canvas || !context || !lastPointRef.current) {
        return;
      }

      event.preventDefault();
      const coordinates = getCoordinates(event);
      context.beginPath();
      context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      context.lineTo(coordinates.x, coordinates.y);
      context.stroke();
      lastPointRef.current = coordinates;
    }

    function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      drawingRef.current = false;
      lastPointRef.current = null;
      canvas.releasePointerCapture(event.pointerId);
      commitSignature();
    }

    function clear() {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) {
        return;
      }

      const width = canvas.width / Math.max(window.devicePixelRatio || 1, 1);
      const height = canvas.height / Math.max(window.devicePixelRatio || 1, 1);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      drawingRef.current = false;
      hasInkRef.current = false;
      lastPointRef.current = null;
      currentDataUrlRef.current = "";
      onChange("");
    }

    useImperativeHandle(ref, () => ({
      clear,
      isEmpty: () => !hasInkRef.current,
      toBlob: () =>
        new Promise<Blob>((resolve, reject) => {
          const canvas = canvasRef.current;
          if (!canvas || !hasInkRef.current) {
            reject(new Error("The signature is not available."));
            return;
          }

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Unable to generate the signature."));
              return;
            }

            resolve(blob);
          }, "image/png");
        }),
    }));

    return (
      <div className="signature-field">
        <div className="signature-field__header">
          <span className="field__label">{label}</span>
          <button className="ghost-button" type="button" onClick={clear}>
            Clear
          </button>
        </div>
        <div className="signature-pad" ref={containerRef}>
          <canvas
            ref={canvasRef}
            aria-label={label}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={(event) => {
              if (drawingRef.current) {
                handlePointerUp(event);
              }
            }}
          />
        </div>
        <p className="signature-field__hint">
          Sign with a finger or touch pen inside the white area.
        </p>
        {error ? <span className="field__error">{error}</span> : null}
      </div>
    );
  },
);
