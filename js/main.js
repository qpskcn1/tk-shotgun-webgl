if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats, controls;
var camera, scene, renderer, light;

var clock = new THREE.Clock();

var mixers = [];
var manager = null;
var loadedFbx;
var wireframeToggle = false;

init();
animate();

function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
    camera.position.set( 2, 18, 28 );

    controls = new THREE.OrbitControls( camera );
    controls.target.set( 0, 12, 0 );
    controls.update();

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xa0a0a0 );
    scene.fog = new THREE.Fog( 0xa0a0a0, 20, 100 );

    light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    light.position.set( 0, 1, 0 );
    scene.add( light );

    light = new THREE.DirectionalLight( 0xffffff );
    light.castShadow = true;
    light.position.set( 0, 20, 10 );
    light.shadow.camera.top = 18;
    light.shadow.camera.bottom = -10;
    light.shadow.camera.left = -12;
    light.shadow.camera.right = 12;
    scene.add( light );

    // scene.add( new THREE.CameraHelper( light.shadow.camera ) );

    // ground
    var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 200, 200 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    var grid = new THREE.GridHelper( 200, 20, 0x000000, 0x000000 );
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add( grid );

    // model
    var loader = new THREE.FBXLoader();
    loader.load( 'models/fbx/lengi_full.fbx', function ( object ) {

        console.log( "object: ",  object )
        object.mixer = new THREE.AnimationMixer( object );
        mixers.push( object.mixer );
        try {
            var action = object.mixer.clipAction( object.animations[ 0 ] );
            action.play();                        
        } 
        catch(err) {
            console.warn("No animation\n" + err);
        }
        object.traverse( function ( child ) {

            if ( child.isMesh ) {

                child.castShadow = true;
                var tempGeo = new THREE.Geometry().fromBufferGeometry( child.geometry );
                tempGeo.mergeVertices();

                var modifier = new THREE.SubdivisionModifier(3);
                modifier.modify (tempGeo);

                tempGeo.computeFaceNormals();
                tempGeo.computeVertexNormals();
                child.geometry = new THREE.BufferGeometry().fromGeometry( tempGeo );                       
            }

        } );
        console.log("Scale object")
        loadedFbx = object;
        scene.add( object );

    });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

    // stats
    stats = new Stats();
    container.appendChild( stats.dom );

}


function toggleWireframe() {
    // model
    if (loadedFbx) {
        if (!wireframeToggle) {
            loadedFbx.traverse( function ( child ) {
                if (child.isMesh) {

                    var geo = new THREE.WireframeGeometry( child.geometry );
                    var mat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
                    var wireframe = new THREE.LineSegments( geo, mat );
                    child.add ( wireframe );
                    // child.material.wireframe = true
                    // console.log(child.children)
                    // console.log(child.children.array)

                }
            });
            console.log("Wireframe On")
        } else {
            loadedFbx.traverse( function ( child ) {
                if ( child.type == "LineSegments" ) {
                    
                    child.parent.remove( child );

                }
            });
            console.log("Wireframe Off")
        }
        wireframeToggle = !wireframeToggle;
        // scene.add(loadedFbx)
    } else {
        console.error("No Fbx loaded")
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    requestAnimationFrame( animate );

    if ( mixers.length > 0 ) {

        for ( var i = 0; i < mixers.length; i ++ ) {

            mixers[ i ].update( clock.getDelta() );

        }

    }

    renderer.render( scene, camera );

    stats.update();

}