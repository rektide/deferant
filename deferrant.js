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

// whether we are a promise, or are just a naked object, we're going to need these to become a deferrant
const
  commonProps= {
	resolve: { // wrapped resolve
		value: resolve,
		writable: true
	},
	reject: { // wrapped reject
		value: reject,
		writable: true
	},

	[ Resolve]: { // super's resolve
		value: null,
		writable: true
	},
	[ Reject]: { // super's reject
		value: null,
		writable: true
	},
	resolved: reserved, // resolved value
	rejected: reserved, // rejected value
	fulfilled: reserved, // state
	promise: { // make compatible with `Deferred` by this (<--pun!) alias.
		value: null,
		writable: true
	},
	[ Symbol.species]: {
		value: Promise.constructor
	}
  },
  // regular objects being promoted to thenables need these additional methods
  promotedProps= {
	...commonProps,
	then: {
	  value: then
	},
	catch: {
	  value: _catch
	},
	finally: {
	  value: _finally
	}
  }

export function deferrantize( self, _resolve, __reject){
	const
	  // if we're already a promise we'll have these
	  noThen= !self.then,
	  noCatch= !self.catch,
	  noFinally= !self.finally,
	  promoted= noThen|| noCatch|| noFinally, // please no promises with no finally lol
	  props= promoted? promotedProps: commonProps
	Object.defineProperties( self, props)

	// set that which ought be set:
	if( _resolve){
		self[ Resolve]= _resolve
		self[ Reject]= _reject
	}
	if( promoted){
		arrayitize( self)
	}
	self.promise= self
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

export const deferrant = Deferrant.create
export const create = Deferrant.create

export { create as default};
