var camera, scene;
var renderer;
var container;

var fixed = document.getElementById('webGL_canvas');

fixed.addEventListener('touchmove', function(e) {

        e.preventDefault();

}, false);

var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

// Light Color Config
var directionalLightColor = 0xEAF2FF;
var ambientLightColor = 0xE6F1FE;

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


//#region Deprecated Controls
/*
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
*/
//#endregion


//Trackballcontrols
var tcontrols = new THREE.TrackballControls(camera, container);
tcontrols.noPan = true;
tcontrols.noZoom = true;
tcontrols.dynamicDampingFactor = 0.06;
tcontrols.rotateSpeed = 1.2;
tcontrols.enableKeys = false;

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

    /*All lights are set here. This includes all shadow properties */

    //Add ambient light
    scene.add(new THREE.AmbientLight(ambientLightColor, 1));

    //Set up Directional Light
    var light;
    light = new THREE.DirectionalLight(directionalLightColor, 0.5);
    light.position.set(300, -200, 0);
    light.position.multiplyScalar(1.3);
    light.shadow.enabled = false;
    //Add Directional light to scene
    camera.add(light);

    var backlight2;
    backlight2 = new THREE.PointLight(ambientLightColor, 0.2);
    backlight2.position.set(0, -60, 30);
    backlight2.shadow.enabled = false;

    camera.add(backlight2);

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
                    child.castShadow = false;
                    child.receiveShadow = false;
                }
            });            
            scene.add(object);
        });
        //#endregion
    });


    // RENDERER
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("canvas"),
        alpha: true,
        antialias: false
    });

    renderer.setPixelRatio(3);
    renderer.shadowMap.enabled = false;    

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
    tcontrols.update();
    resizeCanvasToDisplaySize();

    tcontrols.handleResize();
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}
