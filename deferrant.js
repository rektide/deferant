function noop(){
}
function resolve( val){
	this.resolved= val
	this.fulfilled= "resolved"
	this.resolve= noop
	this.reject= noop
	this._resolve( val)
}
function reject(err){
	this.rejected= err
	this.fulfilled= "rejected"
	this.resolve= noop
	this.reject= noop
	this._reject( err)
}
const reserved= {
	value: undefined,
	writable: true
}

export class Deferrant extends Promise{
	constructor( executor){
		var _resolve, _reject
		super(( resolve, reject)=> {
			executor= executor|| noop
			_resolve= resolve
			_reject= reject
			executor()
		})
		Object.defineProperties(this, {
			_resolve: { // super's resolve
				value: _resolve
			},
			_reject: { // super's reject
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
				value: this
			}
		})
	}
	static create(){
		return new Deferrant( noop)
	}
}

const create = Deferrant.create

export { create, create as default};
