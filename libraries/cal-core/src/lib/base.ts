export abstract class BaseClass<T>{
  /**
  * The original input to the function
  * @type {T}
  * @memberof BaseClass
  * @description This is the original input to the function.  It is not modified by the framework.
  * @deprecated
  */
  public originalInput!: T; 
}