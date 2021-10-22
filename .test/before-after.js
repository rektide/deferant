"use module"
import { deferrant, deferrantize} from "../deferrant.js"
import tape from "tape"


function immediate(){
	return new Promise( res=> setImmediate( res()))
}

tape( "before blocks resolve", function( t){
	t.plan( 5)
	let step= 0
	async function delay(){
		t.equal( step++, 0, "before starts")
		await immediate()
		t.equal( step++, 3, "before terminates")
	}
	const d= deferrant({ before: delay()})
	d.then( function(){
		t.equal( step++, 4, "success")
		t.end()
	})
	t.equal( step++, 1, "nothing run yet")
	d.resolve()
	t.equal( step++, 2, "resolve started")
})


tape( "after gates completion", function( t){
	t.plan( 5)
	let step= 0
	async function delay(){
		t.equal( step++, 0, "before starts")
		await immediate()
		t.equal( step++, 3, "before terminates")
	}
	const d= deferrant({ after: delay()})
	d.then( async ()=>{
		t.equal( step++, 4, "success")
		t.end()
	})
	t.equal( step++, 1, "then is setup")
	d.resolve()
	t.equal( step++, 2, "resolve started")
})
