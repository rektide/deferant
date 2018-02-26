"use strict"
var
  esm= require( "@std/esm")( module),
  deferrant= esm( "./deferrant.js")

module.exports= deferrant.default
Object.defineProperties( module.exports, {
	create: {
		value: deferrant.create
	},
	Deferrant: {
		value: deferrant.Deferrant
	}
})
