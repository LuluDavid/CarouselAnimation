// INIT FUNCTION

function init() {
	// parameters
	rotationSpeed = 0.02
	carouselRadius = 10
	edgeHeight = 3
	ballSize = 1
	initialSpeed = 5
	deltaT = 1/60
	rotationVector = (new THREE.Vector3(0,0,1) ).multiplyScalar(rotationSpeed);

	// Build scene
	container = document.getElementById( 'container' );

	view.camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, view.near, view.far );
	view.camera.position.fromArray( view.eye );
	view.camera.up.fromArray( view.up );


	view2.camera = new THREE.PerspectiveCamera( view2.fov, window.innerWidth / window.innerHeight, view2.near, view2.far );
	view2.camera.position.fromArray( view2.eye );
	view2.camera.up.fromArray( view2.up );

	scene = new THREE.Scene();
	var controls = new THREE.OrbitControls( view.camera );

	// renderer settings
	renderer = new THREE.WebGLRenderer( { antialias: true} );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.shadowMapSoft = true;
	renderer.shadowMapDebug = true;

	container.appendChild( renderer.domElement );

	// add a light
	addALight(scene);

	// create ground
	ground = createGround(scene);
	// create carousel
	carousel = createCarousel(carouselRadius,edgeHeight,0xffffff,scene);
	carousel.castShadow = true;
	carousel.receiveShadow = true;

	// create ball
	ball = addASphere(ballSize,0xff0000,{x:carouselRadius/2,y:0,z:ballSize},carousel)
	ball.castShadow = true;
	ball.speed = (new THREE.Vector3(-1,0,0) ).multiplyScalar(initialSpeed);

	controls.update();
	animate();

}

// ANIMATE AND UPDATE FUNCTIONS

function animate(){

	animateBall();
	animateCarousel();
	render();
	requestAnimationFrame( animate );

	
}

function animateCarousel(){
	carousel.rotateZ(rotationSpeed);
}

function animateBall(){
	radialVector = ball.position.clone().sub( carousel.position ).sub(new THREE.Vector3(0,0,ballSize-0.01))
	let a = radialVector.clone().multiplyScalar( rotationSpeed*rotationSpeed )
	.add( rotationVector.clone().cross( ball.speed ).multiplyScalar(-2) )
	ball.speed.addScaledVector(a,deltaT)
	let nextPosition = ball.position.clone().addScaledVector(ball.speed,deltaT)
	let nextRadialVector = nextPosition.sub( carousel.position ).sub(new THREE.Vector3(0,0,ballSize-0.01))
	if (nextRadialVector.length() >= carouselRadius-ballSize){
		console.log("collision !",nextRadialVector.length())
		ball.speed.set(-ball.speed.x,-ball.speed.y,-ball.speed.z);
	}
	ball.position.addScaledVector(ball.speed,deltaT);
}


function render() {

	updateSize();

	// First view
	view.updateCamera(view.camera,scene);

	scene.children[2].children[1].visible = true;

	var left = Math.floor( windowWidth * view.left );
	var top = Math.floor( windowHeight * view.top );
	var width = Math.floor( windowWidth * view.width );
	var height = Math.floor( windowHeight * view.height );

	renderer.setViewport( left, top, width, height );
	renderer.setScissor( left, top, width, height );
	renderer.setScissorTest( true );
	renderer.setClearColor( view.background );

	view.camera.aspect = width / height;
	view.camera.updateProjectionMatrix();
	
	renderer.render( scene, view.camera );

	scene.children[2].children[1].visible = false;

	// Second view
	view2.updateCamera(view2.camera,scene,ball);

	var leftview2 = Math.floor( windowWidth * view2.left );
	var topview2 = Math.floor( windowHeight * view2.top );
	var widthview2 = Math.floor( windowWidth * view2.width );
	var heightview2 = Math.floor( windowHeight * view2.height );

	renderer.setViewport( leftview2, topview2, widthview2, heightview2 );
	renderer.setScissor( leftview2, topview2, widthview2, heightview2 );
	renderer.setScissorTest( true );
	renderer.setClearColor( view2.background );

	view2.camera.aspect = widthview2 / heightview2;
	view2.camera.updateProjectionMatrix();

	renderer.render(scene,view2.camera);
}

function updateSize() {

	if ( windowWidth != window.innerWidth ) {

		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;

		renderer.setSize( windowWidth, windowHeight );
	}
}


// FUNCTIONS TO BUILD OBJECTS

// Build a Sphere and add it to parentNode
function addASphere(size,clr,position,parentNode,shadows=true){
	let geometry = new THREE.SphereGeometry( size, 64, 64 );
	let material = new THREE.MeshPhongMaterial({color:clr});
	if (shadows == false) {
		material = new THREE. MeshBasicMaterial({color:clr});
	}
	let sphere = new THREE.Mesh( geometry, material );
	sphere.position.set(position.x,position.y,position.z);
	parentNode.add(sphere);
	return sphere; //only for other use, if needed
}

function createCarousel(size,height,clr,parentNode){
	let carouselGeometry = new THREE.CircleGeometry(size,32);
	let texture = new THREE.TextureLoader().load( 'hypnose.jpg' );
	let carouselMaterial = new THREE.MeshPhongMaterial({color:clr,map:texture});
	let carousel = new THREE.Mesh(carouselGeometry,carouselMaterial);
	carousel.position.set(0,0,0.01);

	let carouselEdgesGeometry = new THREE.CylinderGeometry(size,size,height,32,32,true);
	let carouselEdgesMaterial = new THREE.MeshPhongMaterial({side:THREE.DoubleSide});
	let carouselEdges = new THREE.Mesh(carouselEdgesGeometry,carouselEdgesMaterial);

	carouselEdges.rotateX(Math.PI/2);
	carousel.add(carouselEdges);

	parentNode.add(carousel);
	return carousel;
}

function createGround(parentNode){
	let groundGeometry = new THREE.PlaneGeometry(1000,1000)
	let texture = new THREE.TextureLoader().load( 'herbe.jpg' );
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set( 20, 20 );
	let groundMaterial = new THREE.MeshPhongMaterial({map:texture});
	let ground = new THREE.Mesh(groundGeometry,groundMaterial);
	parentNode.add(ground);
	return ground;
}

function addALight(parentNode){
	let light = new THREE.DirectionalLight(0xffffff,1);
	light.position.set(0,10,10)
	light.castShadow = true;
	light.shadow.mapSize.width = 2048;
	light.shadow.mapSize.height = 2048;
	light.shadow.mapSize.darkness = 0.75;
	light.shadow.camera.near = 1;
	light.shadow.camera.far = 1000;
	light.shadow.darkness = 0.75;

	/* since you have a directional light */
	light.shadow.camera.left = -50;
	light.shadow.camera.right = 50;
	light.shadow.camera.top = 50;
	light.shadow.camera.bottom = -50;
	parentNode.add(light);
}














console.log("DBG: helperFns.js loaded");
