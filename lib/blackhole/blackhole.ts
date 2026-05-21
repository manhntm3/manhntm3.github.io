import {
    type RaymarchCamera,
    getCameraFrame,
    subtract,
    add,
    scale,
    cross,
    normalize,
} from "./camera";

import { rayShader as rayShaderCode } from "./ray.wgsl";

export interface BlackHoleRendererOptions {
    canvas: HTMLCanvasElement;
    camera: RaymarchCamera;
    onStatus?: (message: string) => void;
}

export class BlackHoleRenderer {
    private canvas: HTMLCanvasElement;
    private camera: RaymarchCamera;
    private onStatus?: (message: string) => void;

    private device!: GPUDevice;
    private context!: GPUCanvasContext;
    private canvasFormat!: GPUTextureFormat;

    private uniformBuffer!: GPUBuffer;
    private sampler!: GPUSampler;
    private starsTexture!: GPUTexture;
    private noiseSampler!: GPUSampler;
    private noiseTexture!: GPUTexture;

    private hasStarsTexture = false;

    private displayBindGroupLayout!: GPUBindGroupLayout;
    private displayPipeline!: GPURenderPipeline;
    private displayBindGroup!: GPUBindGroup;

    private readonly uniformData = new ArrayBuffer(96);
    private readonly uniformFloatView = new Float32Array(this.uniformData);
    private readonly uniformUintView = new Uint32Array(this.uniformData);

    constructor(options: BlackHoleRendererOptions) {
        this.canvas = options.canvas;
        this.camera = options.camera;
        this.onStatus = options.onStatus;
    }

    async init(): Promise<void> {
        if (!navigator.gpu) {
            throw new Error("WebGPU is not supported in your browser");
        }

        this.setStatus("Requesting GPU adapter...");
        const adapter = await navigator.gpu.requestAdapter();

        if (!adapter) {
            throw new Error("Failed to get GPU adapter. WebGPU may not be available.");
        }

        this.setStatus("Requesting GPU device...");
        this.device = await adapter.requestDevice();

        const context = this.canvas.getContext("webgpu") as GPUCanvasContext | null;

        if (!context) {
            throw new Error("Failed to get WebGPU canvas context");
        }

        this.context = context;
        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

        this.configureCanvas();
        await this.loadStarsTexture();
        await this.loadNoiseTexture();

        this.createResources();
        this.createPipelines();

        this.setStatus("Black Hole Simulation Running");
    }

    resize(): void {
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;

        this.configureCanvas();

        if (this.canvas.width === oldWidth && this.canvas.height === oldHeight) {
            return;
        }

        this.createResources();
        this.createPipelines();
    }

    render(time: number): void {
        this.updateUniforms(time);

        const commandEncoder = this.device.createCommandEncoder();

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    storeOp: "store",
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                },
            ],
        });

        renderPass.setPipeline(this.displayPipeline);
        renderPass.setBindGroup(0, this.displayBindGroup);
        renderPass.draw(3);
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }

    destroy(): void {
        this.starsTexture?.destroy();
        this.uniformBuffer?.destroy();
        this.noiseTexture?.destroy();
    }

    // private configureCanvas(): void {
    //     const dpr = Math.min(window.devicePixelRatio, 2);
    //     const minWidth = 320;
    //     const minHeight = 240;

    //     this.canvas.width =
    //         Math.max(minWidth, Math.floor(window.innerWidth * dpr)) || minWidth;

    //     this.canvas.height =
    //         Math.max(minHeight, Math.floor(window.innerHeight * dpr)) || minHeight;

    //     this.context.configure({
    //         device: this.device,
    //         format: this.canvasFormat,
    //         alphaMode: "premultiplied",
    //     });
    // }

    private configureCanvas(): void {
        const dpr = Math.min(window.devicePixelRatio, 2);

        const parent = this.canvas.parentElement;
        const rect = parent ? parent.getBoundingClientRect() : null;
        const desiredWidth = Math.max(1, Math.floor(rect ? rect.width : window.innerWidth));
        const desiredHeight = Math.max(1, Math.floor(rect ? rect.height : window.innerHeight));

        this.canvas.width = Math.floor(desiredWidth * dpr);
        this.canvas.height = Math.floor(desiredHeight * dpr);

        this.canvas.style.width = `${desiredWidth}px`;
        this.canvas.style.height = `${desiredHeight}px`;

        this.context.configure({
            device: this.device,
            format: this.canvasFormat,
            alphaMode: "premultiplied",
        });
    }

    private async loadStarsTexture(): Promise<void> {
        this.setStatus("Loading stars texture...");

        try {
            const response = await fetch("/galaxy.jpg");

            if (!response.ok) {
                throw new Error("galaxy.jpg not found");
            }

            const blob = await response.blob();
            const imageBitmap = await createImageBitmap(blob);

            this.starsTexture = this.device.createTexture({
                size: [imageBitmap.width, imageBitmap.height, 1],
                format: "rgba8unorm",
                usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT,
            });

            this.device.queue.copyExternalImageToTexture(
                { source: imageBitmap },
                { texture: this.starsTexture },
                [imageBitmap.width, imageBitmap.height]
            );

            this.hasStarsTexture = true;
            this.setStatus("Stars texture loaded successfully");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            console.warn("Could not load stars.png, using black background:", message);

            this.starsTexture = this.device.createTexture({
                size: [1, 1, 1],
                format: "rgba8unorm",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });

            this.device.queue.writeTexture(
                { texture: this.starsTexture },
                new Uint8Array([0, 0, 0, 255]),
                { bytesPerRow: 4 },
                [1, 1]
            );

            this.hasStarsTexture = false;
        }
    }

    private async loadNoiseTexture(): Promise<void> {
        this.setStatus("Loading noise texture...");
        try {
            const response = await fetch("/noise_deep.png");
            if (!response.ok) throw new Error("noise_deep.png not found");

            const blob      = await response.blob();
            const bitmap    = await createImageBitmap(blob);

            this.noiseTexture = this.device.createTexture({
                size:   [bitmap.width, bitmap.height, 1],
                format: "rgba8unorm",
                usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST        |
                    GPUTextureUsage.RENDER_ATTACHMENT,
            });

            this.device.queue.copyExternalImageToTexture(
                { source: bitmap },
                { texture: this.noiseTexture },
                [bitmap.width, bitmap.height]
            );
        } catch (e) {
            console.warn("noise_deep.png missing — generating 1×1 fallback");
            this.noiseTexture = this.device.createTexture({
                size:   [1, 1, 1],
                format: "rgba8unorm",
                usage:  GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
            });
            this.device.queue.writeTexture(
                { texture: this.noiseTexture },
                new Uint8Array([128, 128, 128, 255]),
                { bytesPerRow: 4 },
                [1, 1]
            );
        }
    }

    private createResources(): void {
        this.uniformBuffer = this.device.createBuffer({
            size: 96,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.sampler = this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            addressModeU: "repeat",
            addressModeV: "clamp-to-edge",
        });

        this.noiseSampler = this.device.createSampler({
            magFilter:    "linear",
            minFilter:    "linear",
            addressModeU: "repeat",        // angle wraps
            addressModeV: "clamp-to-edge", // radial clamps at edges
        });
    }

    private createPipelines(): void {

        const shaderModule = this.device.createShaderModule({
            code: rayShaderCode,
        });

        this.displayBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: "float" },
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: "filtering" },
                },
                { 
                    binding: 3, 
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: "float" } 
                },
                { 
                    binding: 4, 
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: "filtering" } 
                },
            ],
        });

        this.displayPipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [this.displayBindGroupLayout],
            }),
            vertex: {
                module: shaderModule,
                entryPoint: "vs_main",
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fs_main",
                targets: [{ format: this.canvasFormat }],
            },
            primitive: { topology: "triangle-list" },
        });

        this.displayBindGroup = this.device.createBindGroup({
            layout: this.displayBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.starsTexture.createView() },
                { binding: 2, resource: this.sampler },
                { binding: 3, resource: this.noiseTexture.createView() },
                { binding: 4, resource: this.noiseSampler },
            ],
        });
    }

    private updateUniforms(time: number): void {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const aspectRatio = width / height;

        const cameraFrame = getCameraFrame(this.camera);

        const cameraPosition = cameraFrame.position;
        const lookTo = cameraFrame.target;
        const universeUp = cameraFrame.up;

        const focalLength = 1;

        const fov = Math.PI / 3;
        const viewportHeight = 2 * Math.tan(fov / 2) * focalLength;
        const viewportWidth = viewportHeight * aspectRatio;

        const z = normalize(subtract(cameraPosition, lookTo));
        const x = normalize(cross(universeUp, z));
        const y = cross(z, x);

        const vectorW = scale(x, viewportWidth);
        const vectorH = scale(y, -viewportHeight);

        const deltaW = scale(vectorW, 1 / width);
        const deltaH = scale(vectorH, 1 / height);

        const topLeft = subtract(
            subtract(cameraPosition, scale(z, focalLength)),
            scale(add(vectorW, vectorH), 0.5)
        );

        const pixel00 = add(topLeft, scale(add(deltaW, deltaH), 0.5));

        const floatView = this.uniformFloatView;
        const uintView = this.uniformUintView;

        floatView[0] = cameraPosition[0];
        floatView[1] = cameraPosition[1];
        floatView[2] = cameraPosition[2];
        floatView[3] = time;

        floatView[4] = pixel00[0];
        floatView[5] = pixel00[1];
        floatView[6] = pixel00[2];
        uintView[7] = this.hasStarsTexture ? 1 : 0;

        floatView[8] = deltaW[0];
        floatView[9] = deltaW[1];
        floatView[10] = deltaW[2];
        uintView[11] = width;

        floatView[12] = deltaH[0];
        floatView[13] = deltaH[1];
        floatView[14] = deltaH[2];
        uintView[15] = height;

        floatView[16] = 1.0;
        floatView[17] = 0;
        floatView[18] = 0;
        floatView[19] = 0;

        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);
    }

    private setStatus(message: string): void {
        this.onStatus?.(message);
    }
}