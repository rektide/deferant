"use module"
import { Deferrant} from ".."

import tape from "tape"

tape( "extend deferrant", async function( t){
	t.plan(3)
	const ExtendedDeferrant= class extends Deferrant{
		executor( resolve){
			t.pass( "executor called")
			resolve(42)
		}
	}
	const de= ExtendedDeferrant.create()
	const de2= await de.then( function( val){
		t.equal( val, 42, "found resolved value")
		return 44
	})
	t.equal( de2, 44, "got next")
	t.end()
})
