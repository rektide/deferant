"use module"
import { Deferrant} from ".."

import tape from "tape"

tape( "extend deferrant", async function( t){
	t.plan(2)
	const ExtendedDeferrant= class extends Deferrant{
		executor( resolve){
			t.pass( "executor called")
			resolve(42)
		}
	}
	const de= ExtendedDeferrant.create()
	await de.then( function( val){
		t.equal( val, 42, "found resolved value")
	})
	t.end()
})
