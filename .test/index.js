import { deferrant, deferrantize } from ".."

import tape from "tape"

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
	t.equal( d.resolved, 42, "`resolved` is now synchronously readable")
	t.equal( d.fulfilled, "resolved", "understood this was a reosolve not a reject")
	const d3= await d.promise
	t.equal( d3, 42, "d.promise yielded meaning")
	t.end()
})

tape( "upgrade an object to a deferrant", async function( t){
	t.plan( 2)
	const
	  o= {a:1},
	  oOut= deferrantize( o)
	t.equal(oOut, o, "deferrantize returns the object it enhances")
	o.resolve( 6* 9)
	const
	  next= o.then( a=> a* 2),
	  val= await next
	t.equal( val, 108)
	t.end()
})
