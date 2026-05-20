import { createCamera, setupCameraControls } from "./src/camera";
import { BlackHoleRenderer } from "./src/blackhole";

class App {
    private canvas: HTMLCanvasElement;
    private statusEl: HTMLElement;
    private fpsEl: HTMLElement;
    private errorEl: HTMLElement;

    private camera = createCamera();
    private renderer!: BlackHoleRenderer;

    private time = 0;
    private lastTime = performance.now();
    private frameCount = 0;
    private resizeTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor() {
        const canvas = document.getElementById("canvas");
        const statusEl = document.getElementById("status");
        const fpsEl = document.getElementById("fps");
        const errorEl = document.getElementById("error");

        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error("Canvas element #canvas not found");
        }

        if (!statusEl || !fpsEl || !errorEl) {
            throw new Error("Required UI elements not found");
        }

        this.canvas = canvas;
        this.statusEl = statusEl;
        this.fpsEl = fpsEl;
        this.errorEl = errorEl;
    }

    async start(): Promise<void> {
        try {
            this.renderer = new BlackHoleRenderer({
                canvas: this.canvas,
                camera: this.camera,
                onStatus: (message) => this.updateStatus(message),
            });

            setupCameraControls(this.canvas, this.camera);

            // TODO: Properfix the resize, but Skip the resize part for now
            window.addEventListener("resize", () => {
                if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.renderer.resize();
                }, 100);
            });

            await this.renderer.init();

            this.animate();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.showError(message);
        }
    }

    private animate(): void {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;

        this.lastTime = currentTime;
        this.time += deltaTime;
        this.frameCount++;

        if (this.frameCount % 30 === 0) {
            const fps = Math.round(1 / deltaTime);
            this.fpsEl.textContent = `FPS: ${fps}`;
        }

        this.renderer.render(this.time);

        requestAnimationFrame(() => this.animate());
    }

    private updateStatus(message: string): void {
        this.statusEl.textContent = message;
    }

    private showError(message: string): void {
        this.errorEl.textContent = message;
        this.errorEl.classList.remove("hidden");

        const overlay = document.getElementById("overlay");
        overlay?.classList.add("hidden");
    }
}

const app = new App();
void app.start();