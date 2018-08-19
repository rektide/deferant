"use strict"
var
  esm= require( "esm")( module),
  deferrant= esm( "./deferrant.js")

module.exports= deferrant.create
Object.keys( deferrant).forEach( key=> module.exports[ key]= deferrant[ key])
