import multifun from "multifun"

const
  Resolve= Symbol.for("deferrant:resolve"),
  Reject= Symbol.for("deferrant:reject"),
  reserved= {
	value: undefined,
	writable: true
  }
function Noop(){}
function identity(i){
	return i
}

// resolution functions
function resolve( val){
	this.resolved= val
	this.fulfilled= "resolved"
	this.resolve= Noop
	this.reject= Noop
	this[ Resolve]( val)
	this[ Resolve]= null
	return this
}
function reject( err){
	this.rejected= err
	this.fulfilled= "rejected"
	this.resolve= Noop
	this.reject= Noop
	this[ Reject]( val)
	this[ Reject]= null
	return this
}

// promise functions
function then( onFulfilled, onRejected){
	return new Promise(( res, rej)=> {
		this[ Resolve].push( v=> {
			try{
				res( onFulfilled( v))
			}catch( ex){
				rej( onRejected( ex))
			}
		})
		this[ Reject].push( v=> {
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
		o[ Resolve]= new multifun( resolve)
	}else if( !resolve){
		o[ Resolve]= new multifun()
	}
	const reject= o[ Reject]
	if( reject instanceof Function){
		o[ Reject]= new multifun( reject)
	}else if(!reject){
		o[ Reject]= new multifun()
	}
}

export {
  // symbols
  Resolve,
  Reject,

  /* resolution methods */
  resolve,
  reject,

  /* promise implementations */
  then,
  _catch as catch,
  _finally as finally,

  /* misc helper */
  Noop
}

export function deferrantize( self, _resolve, _reject){
	Object.defineProperties( self, {
		resolve: { // wrapped resolve
			value: resolve,
			writable: true
		},
		reject: { // wrapped reject
			value: reject,
			writable: true
		},

		[ Resolve]: { // super's resolve
			value: _resolve,
			writable: true
		},
		[ Reject]: { // super's reject
			value: _reject,
			writable: true
		},
		resolved: reserved, // resolved value
		rejected: reserved, // rejected value
		fulfilled: reserved, // state
		promise: { // make compatible with `Deferred` by this (<--pun!) alias.
			value: self
		},
		[ Symbol.species]: {
			value: Promise.constructor
		}
	})
	const conditionals= {}
	let conditional= false
	if( !self.then){
		conditional= true
		conditionals.then= {
			value: then
		}
		arrayitize( self)
	}
	if( !self.catch){
		conditionals.catch= {
			value: _catch
		}
		conditional= true
	}
	if( !self.finally){
		conditionals.finally= {
			value: _finally
		}
		conditional= true
	}
	if( conditional){
		Object.defineProperties( self, conditionals)
	}
	return self
}
export class Deferrant extends Promise{
	constructor( executor){
		let _resolve, _reject
		super(function( resolve, reject){
			executor= executor|| Noop
			_resolve= resolve
			_reject= reject
			return executor( _resolve, _reject)
		})
		deferrantize( this, _resolve, _reject)
	}
	static create( fn){
		return new Deferrant( fn|| Noop)
	}
	static deferrantize( o){
		return deferrantize( o)
	}
}

export const create = Deferrant.create

export { create as default};
