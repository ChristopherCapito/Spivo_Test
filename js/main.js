var camera, scene;
var renderer;
var container;

//Camera Setup
camera = new THREE.PerspectiveCamera(30, 1, 1, 100000);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 50;
camera.lookAt({
    x: 0,
    y: 0,
    z: 0
});

//Camera Controls
var controls = new THREE.OrbitControls(camera, container);
controls.enableZoom = false;
controls.enableKeys = false;
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.05;
controls.autoRotateSpeed = 0.5;
controls.autoRotate = true;

// Light Color Config
var directionalLightColor = 0xEAF2FF;
var ambientLightColor = 0x666666;
var pointLightColor = 0xC9CEFF;

init();
animate();

renderer.context.canvas.addEventListener("webglcontextlost", function (event) {
    event.preventDefault();
    // animationID would have been set by your call to requestAnimationFrame
    cancelAnimationFrame(animationID);
}, false);

renderer.context.canvas.addEventListener("webglcontextrestored", function (event) {
    init();
    animate();
}, false);

function init() {

    //Initialize Scene
    scene = new THREE.Scene();


    //#region Lighting
    /*All lights are set here. This includes all shadow properties */

    //Add ambient light
    scene.add(new THREE.AmbientLight(ambientLightColor, 2));

    //Set up Directional Light
    var light;
    light = new THREE.DirectionalLight(directionalLightColor, 0.5);
    light.position.set(300, 400, 50);
    light.position.multiplyScalar(1.3);

    //Set up Directional Light Shadow Properties
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    var d = 20;

    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.far = 10000;

    //Add Directional light to scene
    scene.add(light);

    //Add a backlight
    var backlight;
    backlight = new THREE.PointLight(pointLightColor, 0.2);
    backlight.position.set(-200, 0, 50);
    scene.add(backlight);
    //#endregion

    //#region Object Loading

    //Initialize MTLLoader
    var mtlLoader = new THREE.MTLLoader();

    //Set up resource paths
    mtlLoader.setTexturePath('assets/');
    mtlLoader.setPath('assets/');

    //Start loading function
    mtlLoader.load('spivo_model.mtl', function (materials) {

        materials.preload();

        //The Object loading function is nested in here
        //Initialize OBJLoader
        var objLoader = new THREE.OBJLoader();

        //Assign .mtl
        objLoader.setMaterials(materials);

        //Set up resource paths
        objLoader.setPath('assets/');
        objLoader.load('spivo_model.obj', function (object) {

            //Change settings for subobjects of the .obj
            object.traverse(function (child) {
                if (child instanceof THREE.Mesh) {

                    //Cast & receive for selfshadowing
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            object.castShadow = true;
            scene.add(object);
        });
        //#endregion
    });


    // RENDERER
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("canvas"),
        alpha: true,
        antialias: true
    });

    //Resizer Tool only kinda works, does not limit to the div
    //var winResize = new THREEx.WindowResize(renderer,camera);
    //winResize.trigger();

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.typeype = THREE.PCFSoftShadowMap;

    //Not the optimal solution but eh
    resizeCanvasToDisplaySize(true);
    window.addEventListener('resize', resizeCanvasToDisplaySize, false);
}

function resizeCanvasToDisplaySize(force) {
    canvas = renderer.domElement;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (force || canvas.width !== width || canvas.height !== height) {
        // you must pass false here or three.js sadly fights the browser
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        // set render target sizes here
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

function render() {
    resizeCanvasToDisplaySize();
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}