"use strict"
////////////// HELPERS ////////////////
function die(message) {
    alert(message);
	throw message;
}

function def(scalar) {
	return typeof(scalar) !== 'undefined'
}

////////////////////// CLASSES //////////////////////////
class Particle {
    constructor(radius) {
        this.radius = radius
        this.time_initial = 0
        this.theta_speed = Math.TAU/8*Math.random() // one great circle in __ seconds is max speed
        this.alpha_speed = Math.TAU/0.5*Math.random() // one little circle in __ second is max speed
        // create new DOM element
        Particle.id++
        this.id = "particle-"+Particle.id.toString()
        $("body").append("<div class='particle' id='"+this.id+"'></div>")
    }

    polar_coors(time) {
        var time_elapsed = time - this.time_initial
        return [(this.theta_speed*time_elapsed) % (Math.TAU/2), (this.alpha_speed*time_elapsed) % Math.TAU]
    }

    cart_coors(time) {
        return polarToCart(this.polar_coors(time))
    }
}
Particle.id = 0
function polarToCart(polar) {
    var theta = polar[0]
    var alpha = polar[1]

    var adjustedRadius = R + r * Math.cos(alpha)
    return new Vector(adjustedRadius*Math.cos(theta), adjustedRadius*Math.sin(theta), r*Math.sin(alpha))
}


class Vector {
    constructor(a,b,c) {
        this[0] = a
        this[1] = b
        this[2] = c
        // abc=[a,b,c]
        // for( let i in abc ) this[i] =
        // if( def(abc[3]) ) alert('fourth component of input array is defined!')
    }

    get mag() {
        return Math.sqrt(this[0]*this[0] + this[1]*this[1] + this[2]*this[2])
    }

    scale(scalar) {
        var newVec=new Vector(0,0,0)
        for (var i=0; i<3; i++) newVec[i] = this[i]*scalar
        return newVec
    }

    dot(v) {
        // Do the dot product on two length 3 vectors
        var result=0
        for (var i=0; i<3; i++) result += this[i]*v[i]
        return result
    }

    cross(v) {
        // Calculate cross product between 2 vectors
        var v3=new Vector(0,0,0)
        v3[0]=this[1]*v[2]-v[1]*this[2]
        v3[1]=this[2]*v[0]-v[2]*this[0]
        v3[2]=this[0]*v[1]-v[0]*this[1]
        return v3
    }

    add(v, sign) {
        if( !def(sign) ) sign = 1
        // Take two length 3 vectors and do the operation this+sign*v
        var newVec=new Vector(0,0,0)
        for( var i=0; i<3; i++ ) newVec[i] = this[i] + sign*v[i]
        return newVec
    }

    unit() {
        return this.scale(1/this.mag)
    }
}


class Camera {

    constructor(camLoc) {
        // Must define the camera location and the vector direction it points
        this.loc = camLoc
        this.focus = new Vector(0, 0, 0)
        this.dir = this.focus.add(this.loc, -1).unit()

        this.upVec = new Vector(0, 0, 1) // Which way is up for the camera
        this.thZero = this.upVec.cross(this.dir).unit()

        this.FOV = Math.PI/3 //Defines the field of view, with which phi is scaled
    }

    screenCoors(objXYZ, screenSize) {
        // Given the x, y, z location of the element, return its position in (x,y) on the screen
        //alert('xyz: '+ objXYZ)

        // Determine 3 numbers in new coordinate system to describe element location:
        // d, for depth away from camera in direction camera is facing
        // th, for theta for the angle around the camera direction
        // phi, for the angle away from the camera direction

        // get d, or depth from camera

        var objCamVec = objXYZ.add(this.loc,-1)

        var d = objCamVec.dot(this.dir) //scalar
        var proj=this.dir.scale(d) //vector

        // get phi, or angle away from where camera is pointed
        var phi = Math.acos(d/objCamVec.mag)

        //Now get theta, rotation around view axis
        var outwardVec = objCamVec.add(proj,-1).unit() //vector between camera axis and object

        var th=Math.acos(outwardVec.dot(cam.thZero)) //returns theta between 0 and pi
        var sign = -cam.thZero.cross(outwardVec).dot(this.dir) //if positive, 0<theta<pi. If negative, -pi<theta<10
        if (sign<0) th*=-1

        //The displayed position on the screen cannot have anything to do with the depth, so only use phi and theta
        //Specifically, use these in polar coordinates. theta=theta, and phi becomes the radius
        var screenR=screenSize*phi/this.FOV //Note, because screen is square, some r that are greater than 1 will still appear at some angles
        var xScreen = screenR*Math.cos(th)
        var yScreen = screenR*Math.sin(th)

        return [xScreen,yScreen,objCamVec.mag] // Also return the distance away of the particle
    }

}

// LINK: http://umkk6308e43e.mvlancellotti.koding.io/index.html
// GLOBALS
Math.TAU = 2*Math.PI
var R = 400 // large radius of semicircle
var r = 40 // small radius of cross section of vortex
var rInterval = {}
var interval_length = 10 // in milliseconds
var time = 0
var max_particles = 50
var cam = new Camera(new Vector(0, 500, 100))

function initialStart() {
    rInterval = window.setInterval(iterate,interval_length)
}

var particles = []
function iterate() {
    time += interval_length/1000 // in seconds

    if(particles.length < max_particles) {
        particles.push(new Particle(5))
    }
    _.each(particles, function(particle) {
        draw(particle, time) // Pass particle object, time, and screen size
    })
}

function draw(p, time) {
    var sSize = Math.min(winWidth,winHeight)/2

    var cartCoors = p.cart_coors(time)
    // alert('cartCoors: '+cartCoors)
    var screenCoors = cam.screenCoors(cartCoors, sSize)
    //alert('screenCors: '+JSON.stringify(screenCoors))
    var depth=screenCoors[2]
    var p_diameter = sSize*Math.atan(p.radius/depth)/cam.FOV

    var $obj = $('#'+p.id)
    $obj.css("left", screenCoors[0]-p_diameter/2+winWidth/2)
    $obj.css("top", screenCoors[1]-p_diameter/2+winHeight/2)
    $obj.width(p_diameter)
    $obj.height(p_diameter)
}

var winWidth = $(window).width()
var winHeight = $(window).height()
function resize() {
    winWidth = $(window).width()
    winHeight = $(window).height()
}
