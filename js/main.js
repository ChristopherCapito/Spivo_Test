var camera, scene;
var renderer;
var container;

//Camera Setup
camera = new THREE.PerspectiveCamera(30, 1, 1, 100000);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 50;
camera.useQuaternion = true;

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
controls.enableRotate = false;
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.rotateSpeed = 0.05;
controls.autoRotateSpeed = 0.5;
controls.autoRotate = true;


//Trackballcontrols
var tcontrols = new THREE.TrackballControls(camera, container);
tcontrols.noPan=true;
tcontrols.noZoom=true;
tcontrols.dynamicDampingFactor=0.05;
tcontrols.rotateSpeed=1;
tcontrols.enableKeys = false;





// Light Color Config
var directionalLightColor = 0xEAF2FF;
var backlightcolor = 0x007CBA;
var filllightcolor = 0xAF1A73;
var ambientLightColor = 0xC9E2FE;

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
    scene.add(camera);
    


    //#region Lighting
    /*All lights are set here. This includes all shadow properties */

    //Add ambient light
    scene.add(new THREE.AmbientLight(ambientLightColor, 0.8));

    //Set up Directional Light
    var light;
    light = new THREE.DirectionalLight(directionalLightColor, 1);
    light.position.set(300, -200, 0);
    light.position.multiplyScalar(1.3);

    //Set up Directional Light Shadow Properties
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    var d = 10;

    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.far = 1000;
    light.shadowDarkness = 10;

    //Add Directional light to scene
    camera.add(light);

    //Add a backlight
    var backlight;    
    backlight = new THREE.DirectionalLight(backlightcolor, 0.5);
    backlight.position.set(-200, 400, 0);
    backlight.castShadow=true;
    camera.add(backlight);
    

    //Add a filllight
    var filllight;
    filllight = new THREE.DirectionalLight(filllightcolor, 0.5);
    filllight.position.set(-450, -450, 0);
    filllight.castShadow=true;
    camera.add(filllight);
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
            object.receiveShadow = true;
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

    renderer.shadowMap.enabled = false;
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
    tcontrols.update();      
    render();
}

function render() {
    resizeCanvasToDisplaySize();
    tcontrols.handleResize();  
    renderer.setPixelRatio(3); 
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}