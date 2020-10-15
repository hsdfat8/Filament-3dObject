// TODO: declare asset URLs
const albedo_suffix = Filament.getSupportedFormatSuffix('astc s3tc');
const texture_suffix = Filament.getSupportedFormatSuffix('etc');

const environ = 'venetian_crossroads_2k'
const ibl_url = `${environ}/${environ}_ibl.ktx`;
const sky_small_url = `${environ}/${environ}_skybox_tiny.ktx`;
const sky_large_url = `${environ}/${environ}_skybox.ktx`;
const albedo_url = `chim${albedo_suffix}.ktx`;
const ao_url = `ao${texture_suffix}.ktx`;
const metallic_url = `metallic${texture_suffix}.ktx`;
const normal_url = `normal${texture_suffix}.ktx`;
const roughness_url = `roughness${texture_suffix}.ktx`;
const filamat_url = 'textured.filamat';
const filamesh_url = 'chim.filamesh';
Filament.init([ filamat_url, filamesh_url, sky_small_url, ibl_url ], () => {
    window.app = new App(document.getElementsByTagName('canvas')[0]);
});

class App {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = Filament.Engine.create(canvas);
        this.scene = this.engine.createScene();

        const material = this.engine.createMaterial(filamat_url);
        this.matinstance = material.createInstance();

        const filamesh = this.engine.loadFilamesh(filamesh_url, this.matinstance);
        this.suzanne = filamesh.renderable;

        // TODO: create sky box and IBL
        this.skybox = this.engine.createSkyFromKtx(sky_small_url);
    this.scene.setSkybox(this.skybox);
    this.indirectLight = this.engine.createIblFromKtx(ibl_url);
    this.indirectLight.setIntensity(100000);
    this.scene.setIndirectLight(this.indirectLight);
    Filament.fetch([sky_large_url, albedo_url, roughness_url, metallic_url, normal_url, ao_url], () => {
    const albedo = this.engine.createTextureFromKtx(albedo_url, {srgb: true});
    const roughness = this.engine.createTextureFromKtx(roughness_url);
    const metallic = this.engine.createTextureFromKtx(metallic_url);
    const normal = this.engine.createTextureFromKtx(normal_url);
    const ao = this.engine.createTextureFromKtx(ao_url);

    const sampler = new Filament.TextureSampler(
        Filament.MinFilter.LINEAR_MIPMAP_LINEAR,
        Filament.MagFilter.LINEAR,
        Filament.WrapMode.CLAMP_TO_EDGE);

    this.matinstance.setTextureParameter('albedo', albedo, sampler);
    this.matinstance.setTextureParameter('roughness', roughness, sampler);
    this.matinstance.setTextureParameter('metallic', metallic, sampler);
    this.matinstance.setTextureParameter('normal', normal, sampler);
    this.matinstance.setTextureParameter('ao', ao, sampler);

    // Replace low-res skybox with high-res skybox.
    this.engine.destroySkybox(this.skybox);
    this.skybox = this.engine.createSkyFromKtx(sky_large_url);
    this.scene.setSkybox(this.skybox);

    this.scene.addEntity(this.suzanne);
});

        // TODO: initialize gltumble
        this.trackball = new Trackball(canvas, {startSpin: 0});
        const tcm = this.engine.getTransformManager();
        const inst = tcm.getInstance(this.suzanne);
        tcm.setTransform(inst, this.trackball.getMatrix());
        inst.delete();
        // TODO: fetch larger assets

        this.swapChain = this.engine.createSwapChain();
        this.renderer = this.engine.createRenderer();
        this.camera = this.engine.createCamera(Filament.EntityManager.get().create());
        this.view = this.engine.createView();
        this.view.setCamera(this.camera);
        this.view.setScene(this.scene);
        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize);

        const eye = [0, 0, 5], center = [0, 0, 0], up = [0, 10, 0];
        this.camera.lookAt(eye, center, up);

        this.resize();
        window.requestAnimationFrame(this.render);
    }

    render() {
        // TODO: apply gltumble matrix
        //const eye = [2, 2, -1], center = [0, 1, 0], up = [0, 5, 0];
        const radians = - Date.now() / 1000;
        this.trackball = new Trackball(this.canvas);
        const transform = mat4.fromRotation(mat4.create(), radians, [0, 1, 0]);
        const tcm = this.engine.getTransformManager();
        const inst = tcm.getInstance(this.suzanne);
        tcm.setTransform(inst, transform);
       // inst.delete();
    // vec3.rotateY(eye, eye, center, 0);
    // this.camera.lookAt(eye, center, up);
        this.renderer.render(this.swapChain, this.view);
        
        window.requestAnimationFrame(this.render);
    }

    resize() {
        const dpr = window.devicePixelRatio;
        const width = this.canvas.width = window.innerWidth * dpr;
        const height = this.canvas.height = window.innerHeight * dpr;
        this.view.setViewport([0, 0, width, height]);

        const aspect = width / height;
        const Fov = Filament.Camera$Fov, fov = aspect < 1 ? Fov.HORIZONTAL : Fov.VERTICAL;
        this.camera.setProjectionFov(45, aspect, 1.0, 10.0, fov);
    }
}