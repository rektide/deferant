"use module"
import multifunc from "multifunc"

const
  Resolve= Symbol.for("deferrant:resolve"),
  Reject= Symbol.for("deferrant:reject"),
  reserved= {
	value: undefined,
	writable: true
  };
export function Noop(){};
function identity(i){
	return i
}

// promise functions
async function then( onFulfilled, onRejected){
	return new Promise(( res, rej)=> {
		const fulfilled= this.fulfilled
		if( fulfilled){
			const
			  cur= this[ fulfilled],
			  isResolved= fulfilled=== "resolved",
			  next= isResolved? onFulfilled( cur): onRejected( cur)
			isResolved? res( next): rej( next)
		}else{
			this[ Resolve].push( res)
			this[ Reject].push( rej)
		}
		this[ Resolve].push( function( v){
			try{
				res( onFulfilled( v))
			}catch( ex){
				rej( onRejected( ex))
			}
		})
		this[ Reject].push( function( v){
			try{
				res( onRejected( v))
			}catch( ex){
				rej( ex)
			}
		})
	})
}

// promise functions with reserved names, via iife & object structuring
const _catch= ({
	[ "catch"]: function( onRejected){
		return this.then( identity, onRejected)
	}
})[ "catch"]
const _finally= ({
	[ "finally"]: function( fn){
		return this.then( fn, fn)
	}
})[ "finally"]

function arrayitize( o){
	const resolve= o[ Resolve]
	if( resolve instanceof Function){
		o[ Resolve]= new multifunc( resolve)
	}else if( !resolve){
		o[ Resolve]= new multifunc()
	}
	const reject= o[ Reject]
	if( reject instanceof Function){
		o[ Reject]= new multifunc( reject)
	}else if(!reject){
		o[ Reject]= new multifunc()
	}
}

const staticProps= {
	resolved: reserved, // resolved value
	rejected: reserved, // rejected value
	fulfilled: reserved // state
}

export function deferrantize( o, _resolve, _reject){
	const props= {
		...staticProps,
		[ Resolve]: { // super's resolve
			value: _resolve,
			writable: true
		},
		[ Reject]: { // super's reject
			value: _reject,
			writable: true
		},
		promise: { // make compatible with `Deferred` by this (<--pun!) alias.
			value: o
		},
	}
	let missingThen= !o.then
	if( missingThen){
		props.then= {
			value: then
		}
	}
	if( !o.catch){
		props.catch= {
			value: _catch
		}
	}
	if( !o.finally){
		props.finally= {
			value: _finally
		}
	}
	if( !o.resolve){
		props.resolve= { // wrapped resolve
			value: Deferrant.prototype.resolve,
			writable: true
		}
		props.reject= { // wrapped reject
			value: Deferrant.prototype.reject,
			writable: true
		}
	}
	Object.defineProperties( o, props)
	if( missingThen){
		arrayitize( o)
	}
	return o
}
export class Deferrant extends Promise{
	static get [Symbol.species](){
		return Promise
	}
	constructor( resolver= Noop){
		let _resolve, _reject
		super( function( resolve, reject){
			_resolve= resolve
			_reject= reject
		})
		deferrantize( this, _resolve, _reject)
		if( this.executor){
			this.executor( _resolve, _reject)
		}
		if( resolver){
			resolver( _resolve, _reject)
		}
	}
	static create( fn= Noop, klass= (this&& this.prototype instanceof Deferrant&& this)|| Deferrant){
		return new klass( fn)
	}
	static deferrantize( o){
		return deferrantize( o)
	}
	resolve( val){
		if( !this[ Resolve]){
			return
		}
		this.resolved= val
		this.fulfilled= "resolved"

		const resolve= this[ Resolve]
		this[ Reject]= null
		this[ Resolve]= null
		resolve.call( this, val)
		return this
	}
	reject( err){
		if( !this[ Reject]){
			return
		}
		this.rejected= err
		this.fulfilled= "rejected"

		const reject= this[ Reject]
		this[ Resolve]= null
		this[ Reject]= null
		reject.call( this, err)
		return this
	}
}

const
  create= Deferrant.create,
  __resolve= Deferrant.prototype.resolve,
  __reject= Deferrant.prototype.reject

export {
  create as default,
  create as create,
  create as deferrant,

  // symbols
  Resolve,
  Reject,

  /* resolution methods */
  __resolve as resolve,
  __reject as reject,

  /* promise implementations */
  then,
  _catch as catch,
  _finally as finally,
}
