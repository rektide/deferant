"use module"
import { deferrant, deferrantize } from ".."

import tape from "tape"

import {} from "./extends.js"
import {} from "./before-after.js"

tape( "create & use a deferrant as a classic defer", async function( t){
	t.plan( 3)
	const d= deferrant()
	d.then( function( d2){
		t.equal( d2, 42, "found our resolved value")
		// we can equivalently use d.promise, which is the same as d
		d.promise.then( function( d3){
			t.equal( d3, 42, "found our resolved value")
			t.equal( d3, d2, "d & d.promise resolve the same")
			t.end()
		})
	})
	d.resolve( 42)
})

tape( "create & use a deferrant", async function( t){
	t.plan( 4)
	const d= deferrant()
	d.resolve( 42)
	const d2= await d
	t.equal( d2, 42, "meaning is resolved")
	t.equal( d.data, 42, "`resolved` is now synchronously readable")
	t.equal( d.fulfilled, "resolved", "understood this was a reosolve not a reject")
	const d3= await d.promise
	t.equal( d3, 42, "d.promise yielded meaning")
	t.end()
})

tape( "upgrade an object to a deferrant, .then then resolve", async function( t){
	t.plan( 1)
	const o= { sample: "hello"}
	deferrantize( o)
	o.resolve( 6* 9) // 54
	const tripled= o.then( a=> a* 3)
	t.equal( await tripled, 162)
	t.end()
})

tape( ".then then resolve an upgraded object", async function( t){
	t.plan( 1)
	const o= { sample: "hello"}
	deferrantize( o)
	const doubled= o.then( a=> a* 2)
	o.resolve( 6* 9)
	t.equal( await doubled, 108)
	t.end()
})
