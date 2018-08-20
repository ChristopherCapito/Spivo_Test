var camera, scene;
var renderer;
var container;
var spivo_model;
var camDistance;
var _camPos = new THREE.Vector3(0, 0, 0);
var group;
var points = ["p1", "p2", "p3", "p4", "p5", "p6"];
var intersects;

//Raycasting for sprite is currently not viable
//so we'll use planes as helpers
var spriteHelpers = [];


//Array for computing the icon's distance from the camera
var distances = [];

//Hold the n closest icons (splice)
var closestIcons = [
    [],
    []
];

//The icon closest to the camera
var highlightedIcon;

var sprite_textures = [
    "assets/sprite_1.png",
    "assets/sprite_2.png",
    "assets/sprite_3.png",
    "assets/sprite_4.png",
    "assets/sprite_5.png",
    "assets/sprite_6.png",
];

//Use this to manipulate the icon positions
var point_pos = [
    //[X, Y, Z]
    //1
    [5, 6, 4],
    //2
    [-5, -2, 4],
    //3
    [2, -10, 5],
    //4
    [-4, -8, -4],
    //5
    [5, 2, -4],
    //6
    [-5, 8, -4],
];

var fixed = document.getElementById('webGL_canvas');

fixed.addEventListener('touchmove', function (e) {
    'use strict';
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

//Trackballcontrols
var tcontrols = new THREE.TrackballControls(camera, container);
tcontrols.noPan = true;
tcontrols.noZoom = true;

//Changes camera deceleration
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

    //Set up backlight for two point lighting
    var backlight2;
    backlight2 = new THREE.PointLight(ambientLightColor, 0.2);
    backlight2.position.set(0, -60, 30);
    backlight2.shadow.enabled = false;

    //Add backlight to scene
    camera.add(backlight2);

    //#region ObjectLoading

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
            //So we can access it outside
            spivo_model = object;
            scene.add(object);
        });
        //#endregion
    });

    //Sprites
    for (i = 0; i < points.length; i++) {

        var spriteMap = new THREE.TextureLoader().load(sprite_textures[i]);
        var material = new THREE.SpriteMaterial({
            map: spriteMap,
            //Uncomment to have sprites always on top
            //depthWrite : false,
            //depthTest : false
        });

        points[i] = new THREE.Sprite(material);
        points[i].name = i + 1;
        points[i].scale.set(2, 2, 1);
        points[i].position.set(point_pos[i][0], point_pos[i][1], point_pos[i][2]);
        console.log(points[i].position);
        scene.add(points[i]);
    }
    console.log(group);

    //Initialize the camDistance
    camDistance = camera.position.length();

    // RENDERER
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("canvas"),
        alpha: true,
        //Turn on to increase quality, has a hit on performance
        antialias:false
    });

    //Could be dynamically set. Currently set
    renderer.setPixelRatio(3);


    //Not the optimal solution but eh
    resizeCanvasToDisplaySize(true);
    window.addEventListener('resize', resizeCanvasToDisplaySize, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);

    // mouse listener
    document.addEventListener('mousedown', onDocumentMouseDown, false);
}

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

function onDocumentTouchStart(event) {
    console.log('called 1');
    pressed = true;
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;

    onDocumentMouseDown(event);
}

function onDocumentMouseDown(event) {

    //Use the rect to keep up with scrolling offset
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

    //Shoot
    raycaster.setFromCamera(mouse, camera);

    //Hit
    intersects = raycaster.intersectObjects(points, false);

    //For the love of god I can't get rid of that TypeError when you hit empty space
    moveToPoint(intersects[0].object.name - 1);

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

    TWEEN.update();
    initialRotation();
    
    camera.lookAt(scene.position);
    hidebyDistance();

    renderer.render(scene, camera);
}


var pressed = false;
document.addEventListener('mousedown', () => pressed = true);


var angle = 0;
var radius = 50;

//Would be boring to have it stand still wouldn't it
function initialRotation() {

    if (!pressed) {
        camera.position.x = radius * Math.cos(angle);
        camera.position.z = radius * Math.sin(angle);
        angle += 0.01;
    }
}

/*  In order to have true spherical movement this would neeed to
    be utilizing polar coordinates. Moving along latitude and
    longitude. Will be implemented at a later point in time
    because it involves some math to get right.
   */
function moveToPoint(i) {

    var tween = new TWEEN.Tween(camera.position);
    var point = new THREE.Vector3();
    point.x = points[i].position.x;
    point.y = points[i].position.y;
    point.z = points[i].position.z;
    console.log(point);

    point.normalize().multiplyScalar(camDistance);
    console.log(point);

    tween.to(point);
    tween.start();

    //camera.position.copy(point).normalize().multiplyScalar(camDistance);
    tcontrols.update();
}

//Hiding Icons by Distance
function hidebyDistance() {

    //Clear the distances array
    distances.length = 0;
    //let distances = new Array();

    //Cache the Vector3 position of the camera transform
    _camPos.copy(camera.position);

    //Loop through the icons
    for (let i = 0; i < points.length; i++) {

        //Hide all points (later the three closest are made visible)
        points[i].visible = false;
        //Calculate the distance from the camera
        var _dist = _camPos.distanceTo(points[i].position);

        //Add the distance with its corresponding icon to the array
        distances.push([_dist, points[i]]);
    }

    //Two-Dimensional sort by distance (first column)
    distances.sort(function (a, b) {
        return a[0] - b[0];
    });

    //Get farthest three icons by slicing the array
    closestIcons = distances.slice(0, 3);

    //Loop through the resulting array
    for (i = 0; i < closestIcons.length; i++) {

        //Now you got the closest icon
        highlightedIcon = closestIcons[0][1];

        //Turn on the visibility for the closest three icons
        closestIcons[i][1].visible = true;
    }
}