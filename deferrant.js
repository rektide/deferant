"use module"
import multifunc from "multifunc"
import eventOnce from "event-once"

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

const staticProps= {
	resolved: reserved, // resolved value
	rejected: reserved, // rejected value
	fulfilled: reserved // state
}

/**
* Convert a passed in object to a promise-like object
*/
export function deferrantize( o, _resolve, _reject){
	const
	  isDeferrant= o instanceof Deferrant,
	  missingThen= !(isDeferrant|| o.then)
	if( missingThen){
		_resolve= new multifunc( ...(_resolve? [_resolve]: []))
		_reject= new multifunc( ...(_reject? [_reject]: []))
	}
	const props= {
		...staticProps,
		...(missingThen&& optionalProps.thenCatchFinally),
		...(!missingThen&& !o.catch&& optionalProps.catch),
		...(!missingThen&& !o.finally&& optionalProps.finally),
		...(!o.reject&& optionalProps.resolveReject),
		...(!o.addSignal&& optionalProps.addSignal),
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
	Object.defineProperties( o, props)
	return o
}

/**
* A promise-derived class that exposes it's resolve/reject methods
*/
export class Deferrant extends Promise{
	static create(opts){
		const baseClass= opts&& opts.baseClass?
		  opts.baseClass:
		  (this&& this.prototype instanceof Deferrant&& this|| Deferrant)
		return new baseClass( opts)
	}
	static deferrantize( o){
		return deferrantize( o)
	}
	static get [Symbol.species](){
		return Promise
	}

	constructor({ resolver= Noop, signal, signalMap}= {}){
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
		if( signal){
			this.addSignal( signal)
		}
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
	addSignal( signal){
		if( signal.aborted){
			this.reject( new AbortException(signal))
			return
		}
		eventOnce( signal, "abort").then( err=> this.reject(new AbortException(err)))
		return this
	}
}

/**
* This class extends Deferrant with implementions of methods borne by Promise.prototype.
* Normally it should not be necessary to use this class.
*/
export class InternalDeferrant extends Deferrant{
	then( onFulfilled, onRejected){
		return new Promise(( res, rej)=> {
			// we're already resolved; do now
			if( this.fulfilled){
				if( this.fulfilled=== "resolved"){
					res( onFulfilled( this.resolved))
				}else{
					rej( onRejected( this.rejected))
				}
				return
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
	catch( onRejected){
		return this.then( identity, onRejected)
	}
	finally( fn){
		return this.then( fn, fn)
	}
}

const optionalProps= {
	then: {
		then: {
			value: InternalDeferrant.prototype.then
		},
	},
	catch: {
		catch: {
			value: InternalDeferrant.prototype.catch
		}
	},
	finally: {
		finally: {
			value: InternalDeferrant.prototype.finally
		}
	},
	thenCatchFinally: {
		then: {
			value: InternalDeferrant.prototype.then
		},
		catch: {
			value: InternalDeferrant.prototype.catch
		},
		finally: {
			value: InternalDeferrant.prototype.finally
		}

	},
	resolveReject: {
		resolve: {
			value: Deferrant.prototype.resolve
		},
		reject: {
			value: Deferrant.prototype.reject
		}
	},
	addSignal: {
		addSignal: {
			value: Deferrant.prototype.signal
		}
	}
}

const create= Deferrant.create

export {
  create as default,
  create as create,
  create as deferrant,

  // symbols
  Resolve,
  Reject
}
