// TODO: declare asset URLs
const albedo_suffix = Filament.getSupportedFormatSuffix('astc s3tc');
const texture_suffix = Filament.getSupportedFormatSuffix('etc');
const environ = 'venetian_crossroads_2k'

// Link light
const ibl_url = `${environ}/${environ}_ibl2.ktx`;

// Link background skybox
const sky_small_url = `${environ}/${environ}_skybox_tiny2.ktx`;
const sky_large_url = `${environ}/${environ}_skybox2.ktx`;

// Link mau`
const albedo_url = `chim${albedo_suffix}.ktx`;

const ao_url = `ao${texture_suffix}.ktx`;
const metallic_url = `metallic${texture_suffix}.ktx`;
const normal_url = `normal${texture_suffix}.ktx`;
const roughness_url = `roughness${texture_suffix}.ktx`;

// Link material
const filamat_url = 'textured.filamat';

// Link vat the
const filamesh_url = 'chim.filamesh';
Filament.init([ filamat_url, filamesh_url, sky_small_url, ibl_url ], () => {
    window.app = new App(document.getElementsByTagName('canvas')[0]);
});

class App {
    constructor(canvas) {
        // Man hinh hien thi
        this.canvas = canvas;

        // Tao engine Filament
        this.engine = Filament.Engine.create(canvas);
        this.scene = this.engine.createScene();
                
        // add material (chat lieu cho be mat vat the - vd nhin nhu kim loai, nhua, etc) 
        const material = this.engine.createMaterial(filamat_url);
        this.matinstance = material.createInstance();
        // add vat the vao engine
        const filamesh = this.engine.loadFilamesh(filamesh_url, this.matinstance);
        this.suzanne = filamesh.renderable;

        // TODO: create sky box and IBL
        this.skybox = this.engine.createSkyFromKtx(sky_small_url);
        this.scene.setSkybox(this.skybox);
        // Tao anh sang 
        this.indirectLight = this.engine.createIblFromKtx(ibl_url);
        // Set do sang'
        this.indirectLight.setIntensity(100000); 
        this.scene.setIndirectLight(this.indirectLight);

        // add texture, chinh lai do phan dai cua skybox
        Filament.fetch([sky_small_url, albedo_url, roughness_url, metallic_url, normal_url, ao_url], () => {
            const albedo = this.engine.createTextureFromKtx(albedo_url, {srgb: true});
            const roughness = this.engine.createTextureFromKtx(roughness_url);
            const metallic = this.engine.createTextureFromKtx(metallic_url);
            const normal = this.engine.createTextureFromKtx(normal_url);
            const ao = this.engine.createTextureFromKtx(ao_url);

            const sampler = new Filament.TextureSampler(
            Filament.MinFilter.LINEAR_MIPMAP_LINEAR,
            Filament.MagFilter.LINEAR,
            Filament.WrapMode.CLAMP_TO_EDGE);
            
            // Mau sac cho vat the
            this.matinstance.setTextureParameter('albedo', albedo, sampler);
            // Do sac net cho vat the
            this.matinstance.setTextureParameter('roughness', roughness, sampler);
            // May cai nay meo hieu la gi- ban tim hieu di
            this.matinstance.setTextureParameter('metallic', metallic, sampler);
            this.matinstance.setTextureParameter('normal', normal, sampler);
            this.matinstance.setTextureParameter('ao', ao, sampler);

            // Replace low-res skybox with high-res skybox.
            this.engine.destroySkybox(this.skybox);
            this.skybox = this.engine.createSkyFromKtx(sky_small_url);
            this.scene.setSkybox(this.skybox);
            this.scene.addEntity(this.suzanne);
        });

        // TODO: initialize gltumble - Khong can giai thich phan nay
        this.trackball = new Trackball(canvas, {startSpin: 0});
        const tcm = this.engine.getTransformManager();
        const inst = tcm.getInstance(this.suzanne);
        tcm.setTransform(inst, this.trackball.getMatrix());
        inst.delete();
        
        
        // TODO: fetch larger assets - Hien vat the len web
        this.swapChain = this.engine.createSwapChain();
        this.renderer = this.engine.createRenderer();
        this.camera = this.engine.createCamera(Filament.EntityManager.get().create());
        this.view = this.engine.createView();
        this.view.setCamera(this.camera);
        this.view.setScene(this.scene);
        this.render = this.render.bind(this);
        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize);

        // Tao goc nhin tu camera
        // eye: mat camera, center: vi tri camera nhin vao, up: do xoay cua camera
        const eye = [0, 0, 8], center = [0, 0, 0], up = [0, 1, 0];
        this.camera.lookAt(eye, center, up);

        this.resize();
        window.requestAnimationFrame(this.render);
        //this.render();
    }

    // Add animation cho vat the, o day bao gom: quay, chuyen dong tinh. tien', scale.
    render() {
        
        // Lay thoi gian, lam cho vat the chuyen dong lien tuc theo thoi gian
        const radians =  Date.now() / 500;
        this.trackball = new Trackball(this.canvas);
        // Tao vecto v de vat the chuyen dong theo duong cheo
        const a = (radians%4)<2?radians%4:-4+radians%4;
        const v = ((2+radians)%8)<4?[a,a,0]:[-a,a,0];


        //Uncomment 1 trong 3 doan code duoi day de chay

        // Quay vat the quanh truc [0,1,0]
        //const transform = mat4.fromRotation(mat4.create(), radians, [0, 1, 0]);


        // Scale vat the
        //const transform = mat4.fromScaling(mat4.create(), [0,2,a]);

        // Di chuyen tinh. tien' vat the
        const transform = mat4.fromTranslation(mat4.create(), v);

        // Cap nhat vi tri vat the sau khi transform
        const tcm = this.engine.getTransformManager();
        const inst = tcm.getInstance(this.suzanne);
        tcm.setTransform(inst, transform);
        this.renderer.render(this.swapChain, this.view);
        window.requestAnimationFrame(this.render);
    }

    // Cap nhat vi tri vat the khi resize vat the    
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
