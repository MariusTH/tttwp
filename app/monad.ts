export class Monad<T> {
    constructor(private value: T) {}
  
    static of<T>(value: T): Monad<T> {
        return new Monad(value);
    }
  
    map<U>(fn: (value: T) => U): Monad<U> {  
        console.log("Calling function : ", fn)
        console.log("Original value : ", this.value)
        const newVal = fn(this.value);  
        console.log("New value : ", newVal)
        return Monad.of(newVal);
    }

    getValue(): T {
        return this.value;
    }
}

export class MaybeMonad<T> {
    private constructor(private value: T | null | undefined) {}
  
    static of<T>(value: T | null | undefined): MaybeMonad<T> {
      return new MaybeMonad(value);
    }
  
    // Map only applies the function if the value is not null/undefined
    map<U>(fn: (value: T) => U): MaybeMonad<U> {
        console.log("Calling function : ", fn)
        console.log("Original value : ", this.value)
        if (this.value === null || this.value === undefined) {
            return MaybeMonad.of<U>(null);
        } 
        const newVal = fn(this.value);
        console.log("New value : ", newVal)
        if (newVal === null || newVal === undefined) {
            return MaybeMonad.of<U>(null);
        }

        return MaybeMonad.of<U>(newVal);
    }
  
    // flatMap is similar to map, but the function must return another MaybeMonad
    flatMap<U>(fn: (value: T) => MaybeMonad<U>): MaybeMonad<U> {
      if (this.value === null || this.value === undefined) {
        return MaybeMonad.of<U>(null);
      } else {
        return fn(this.value);
      }
    }
  
    // Get the value out of the monad, providing a default value if it's None
    getOrElse(defaultValue: T): T {
      return this.value === null || this.value === undefined ? defaultValue : this.value;
    }
  
    // Check if the monad holds a valid value
    isSome(): boolean {
      return this.value !== null && this.value !== undefined;
    }
  
    // Check if the monad is empty (None)
    isNone(): boolean {
      return this.value === null || this.value === undefined;
    }
  }