namespace $ {
	
	export function $mol_wire_mem_cache_reset< Host extends object >( host: Host ) {
		return $mol_wire_mem_cache( host, undefined )
	}
	
	export function $mol_wire_mem_cache< Host extends object, Result >( host: Host, next?: Result ) {
		
		const push = arguments.length > 1
		
		return new Proxy( host, {
			get( obj, field ) {
				
				const val = obj[ field ]
				if( typeof val?.orig !== 'function' ) return val
				
				return function( this: Host, ... args: any[] ) {
					
					if( push ) {
						
						const cache = $mol_wire_fiber.persist( obj, val.orig, ... args )
						
						if( next === undefined ) cache.stale()
						else cache.put( next )
						
						return next
						
					} else {
						
						return obj[ $mol_wire_fiber_key( val.orig, ... args ) ]?.cache
						
					}
					
				}
				
			}
		} )
		
	}
	
	export let $mol_wire_mem = < Keys extends number >( keys: Keys ) => <
		Host extends object ,
		Field extends keyof Host ,
		Prop extends Extract< Host[ Field ] , ( ... args: any[] )=> any >,
	>(
		proto : Host ,
		name : Field ,
		descr? : TypedPropertyDescriptor< Prop >
	)=> {

		if( !descr ) descr = Reflect.getOwnPropertyDescriptor( proto , name )
		const orig = descr!.value!
		
		function value( this: Host, ... args: any[] ) {
			
			let cache = $mol_wire_fiber.persist( this, orig, ... args.slice( 0, keys ) )
			
			if( args[ keys ] === undefined ) {
				return cache.sync()
			}  else {
				const fiber = $mol_wire_fiber.temp( this, orig, ... args )
				const res = fiber.sync()
				cache.put( res )
				return res
			}
			
		}
		
		$mol_func_name_from( value, orig )
		
		Object.assign( value, { orig } )
		const descr2 = { ... descr, value }
		Reflect.defineProperty( proto, name, descr2 )
		
		return descr2

	}

}