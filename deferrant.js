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
function runAll( all, val){
	if( all){
		if( all.forEach){
			all.forEach( fn=> fn( val))
		}else{
			all( val)
		}
	}
}

// resolution functions
function resolve( val){
	this.resolved= val
	this.fulfilled= "resolved"
	this.resolve= noop
	this.reject= noop
	runAll( this[ Resolve], val)
	return this
}
function reject( err){
	this.rejected= err
	this.fulfilled= "rejected"
	this.resolve= noop
	this.reject= noop
	runAll( this[ Reject], err)
	return this
}

// promise functions
function then( onFulfilled, onRejected){
	return new Promise(( res, rej)=> {
		this[ Resolve].push( res)
		this[ Reject].push( rej)
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
		o[ Resolve]= [ resolve]
	}else if( !resolve){
		o[ Resolve]= []
	}
	const reject= o[ Reject]
	if( reject instanceof Function){
		o[ Reject]= [ reject]
	}else if(!reject){
		o[ Reject]= []
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
		[ Resolve]: { // super's resolve
			value: _resolve
		},
		[ Reject]: { // super's reject
			value: _reject
		},
		resolved: reserved, // resolved value
		rejected: reserved, // rejected value
		fulfilled: reserved, // state
		resolve: { // wrapped resolve
			value: resolve
		},
		reject: { // wrapped reject
			value: reject
		},
		promise: { // make compatible with `Deferred` by this (<--pun!) alias.
			value: self
		},
	})
	const
	  conditionals= {},
	  conditional= false
	if( !self.then){
		conditionals.then= then
		conditional= true
		arrayitize( self)
	}
	if( !self.catch){
		conditionals.catch= _catch
		conditional= true
	}
	if( !self.finally){
		conditionals.finally= _finally
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
			executor= executor|| noop
			_resolve= resolve
			_reject= reject
			executor()
		})
		deferrantize( this, _resolve, _reject)
	}
	static create(){
		return new Deferrant( noop)
	}
	static deferrantize( o){
		return deferrantize( o)
	}
}

export const create = Deferrant.create

export { create as default};
