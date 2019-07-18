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
function Identity(i){
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

	constructor({ resolver= Noop, signal, signalMap, before, after, afterResolve, afterReject}= {}){
		let _resolve, _reject
		super( function( resolve, reject){
			if( before|| after){
				_resolve= async ( val)=> {
					await before
					await afterResolve
					await after
					resolve( val)
					return val
				}
			}else{
				_resolve= resolve
			}
			if( before|| afterReject){
				_reject= async ( val)=> {
					await before
					await afterReject
					await after
					reject( val)
					return val
				}
			}else{
				_reject= reject
			}
		})
		deferrantize( this, _resolve, _reject)

		const exec= ()=>{
			if( this.fulfilled){
				return
			}
			if( this.executor){
				this.executor( _resolve, _reject)
			}
			if( resolver){
				resolver( _resolve, _reject)
			}
		}

		if( before){
			before.then( exec)
		}else{
			exec()
		}
		if( signal){
			this.addSignal( signal)
		}
	}
	resolve( val){
		if( !this[ Resolve]){
			return
		}
		this.data= val
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
		this.data= err
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
	then( onResolved, onRejected){
		return new Promise(( res, rej)=> {
			if( this.fulfilled){
				// we're already resolved; do now
				const
				  isResolved= this.fulfilled=== "resolved",
				  handler= isResolved? onResolved: onRejected,
				  data= this.data
				if( !handler){
					// pass along
					(isResolved? res: rej)( data)
				}
				try{
					// try to call handler
					res( handler( data))
				}catch( err){
					// handler failed, so reject
					rej( err)
				}
				return
			}
			// add resolve/reject handlers
			this[ Resolve].push( onResolved&& function( resolved){
				try{
					res( onResolved( resolved))
				}catch( err){
					rej( err)
				}
			}|| function( resolved){
				res( resolved)
			})
			this[ Reject].push( onRejected&& function( rejected){
				try{
					res( onRejected( rejected))
				}catch( err){
					rej( err)
				}
			}|| function( rejected){
				rej( rejected)
			})
		})
	}
	catch( onRejected){
		return this.then( Identity, onRejected)
	}
	async finally( onFinally){
		if( this.fulfilled){
			if( onFinally){
				onFinally()
			}
			return Promise[ this.fulfilled=== "resolved"? "resolve": "reject"]( this.data)
		}
		return new Promise(( res, rej)=> {
			this[ Resolve].push( function( resolved){
				if( onFulfilled){
					onFulfilled()
				}
				res( resolved)
			})
			this[ Reject].push( function( rejected){
				if( onFulfilled){
					onFulfilled()
				}
				rej( rejected)
			})
		})
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
