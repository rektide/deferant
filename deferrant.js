function noop(){
}

export class Deferrant extends Promise{
	constructor( executor){
		var _resolve, _reject
		super( function( resolve, reject){
			executor= executor|| noop
			_resolve= resolve
			_reject= reject
			executor()
		})
		Object.defineProperties(this, {
			resolve: {
				value: val=> {
					_resolve( val)
					this.resolved= true
				}
			},
			reject: {
				value: err=> {
					_reject( err)
					this.resolved= true
				}
			}
		})
		this.resolved= false
	}
	static create(){
		return new Deferrant( noop)
	}
}

const create = Deferrant.create

export { create, create as default};
