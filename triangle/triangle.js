class App {
    constructor(canvas) {
        this.canvas = canvas
        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize);

        const engine = this.engine = Filament.Engine.create(this.canvas)

        this.scene = engine.createScene()
        this.triangle = Filament.EntityManager.get().create()
        this.scene.addEntity(this.triangle)

        const TRIANGLE_POSITIONS = new Float32Array([
            1, 0,
            Math.cos(Math.PI * 2 / 3), Math.sin(Math.PI * 2 / 3),
            Math.cos(Math.PI * 4 / 3), Math.sin(Math.PI * 4 / 3),
        ])
        const TRIANGLE_COLORS = new Uint32Array([0xffff0000, 0xff00ff00, 0xff0000ff])

        const VertexAttribute = Filament.VertexAttribute
        const AttributeType = Filament.VertexBuffer$AttributeType
        this.vb = Filament.VertexBuffer.Builder()
            .vertexCount(3)
            .bufferCount(2)
            .attribute(VertexAttribute.POSITION, 0, AttributeType.FLOAT2, 0, 8)
            .attribute(VertexAttribute.COLOR, 1, AttributeType.UBYTE4, 0, 4)
            .normalized(VertexAttribute.COLOR)
            .build(engine)

        this.vb.setBufferAt(engine, 0, TRIANGLE_POSITIONS)
        this.vb.setBufferAt(engine, 1, TRIANGLE_COLORS)

        this.ib = Filament.IndexBuffer.Builder()
            .indexCount(3)
            .bufferType(Filament.IndexBuffer$IndexType.USHORT)
            .build(engine)
        this.ib.setBuffer(engine, new Uint16Array([0, 1, 2]));

        const mat = engine.createMaterial('nonlit.filamat')
        const matinst = mat.getDefaultInstance()
        Filament.RenderableManager.Builder(1)
            .boundingBox({ center: [-1, -1, -1], halfExtent: [1, 1, 1] })
            .material(0, matinst)
            .geometry(0, Filament.RenderableManager$PrimitiveType.TRIANGLES, this.vb, this.ib)
            .build(engine, this.triangle)

        this.swapChain = engine.createSwapChain()
        this.renderer = engine.createRenderer()
        this.camera = engine.createCamera()
        this.view = engine.createView();
        this.view.setCamera(this.camera)
        this.view.setScene(this.scene)
        this.view.setClearColor([0.1, 0.2, 0.3, 1.0])
        this.resize()

        window.requestAnimationFrame(this.render);

    }

    render() {
        // 渲染旋转着的三角形
        const radians = Date.now() / 1000
        const transform = mat4.fromRotation(mat4.create(), radians, [0, 0, 1])
        const tcm = this.engine.getTransformManager()
        const inst = tcm.getInstance(this.triangle)
        tcm.setTransform(inst, transform)
        inst.delete()

        // 渲染帧
        this.renderer.render(this.swapChain, this.view)

        //  渲染场景
        window.requestAnimationFrame(this.render);
    }

    resize() {
        // 调整视窗和canvas
        const dpr = window.devicePixelRatio;
        const width = this.canvas.width = window.innerWidth * dpr;
        const height = this.canvas.height = window.innerHeight * dpr;
        this.view.setViewport([0, 0, width, height]);
        const aspect = width / height;
        this.camera.setProjection(Projection.ORTHO, -aspect, aspect, -1, 1, 0, 1);
    }
}

// 当所有资源下载完成且Filament模块加载完成后，才会调用callback。
// 在callback中实例花了App对象并绑定在window对象上
// triangle.filamat是一个包含了shader和定义PBR材质的二进制文件
Filament.init(['../libs/nonlit.filamat'], () => {
    window.VertexAttribute = Filament.VertexAttribute;
    window.AttributeType = Filament.VertexBuffer$AttributeType;
    window.Projection = Filament.Camera$Projection;
    window.app = new App(document.getElementById('canvas'));
});