// src/shared/di/Container.ts
/**
 * Dependency Injection Container
 * Gerencia a criação e ciclo de vida das dependências
 */

type Constructor<T = any> = new (...args: any[]) => T
type Factory<T = any> = () => T
type ServiceLifetime = 'singleton' | 'transient' | 'scoped'

interface ServiceDescriptor<T = any> {
  lifetime: ServiceLifetime
  implementation?: Constructor<T>
  factory?: Factory<T>
  instance?: T
}

export class Container {
  private services = new Map<string, ServiceDescriptor>()
  private instances = new Map<string, any>()
  private scopedInstances = new Map<string, any>()

  /**
   * Registrar serviço como singleton
   */
  registerSingleton<T>(token: string, implementation: Constructor<T> | Factory<T>): void {
    this.services.set(token, {
      lifetime: 'singleton',
      ...(typeof implementation === 'function' && implementation.prototype 
        ? { implementation: implementation as Constructor<T> }
        : { factory: implementation as Factory<T> }
      )
    })
  }

  /**
   * Registrar serviço como transient (nova instância a cada resolução)
   */
  registerTransient<T>(token: string, implementation: Constructor<T> | Factory<T>): void {
    this.services.set(token, {
      lifetime: 'transient',
      ...(typeof implementation === 'function' && implementation.prototype 
        ? { implementation: implementation as Constructor<T> }
        : { factory: implementation as Factory<T> }
      )
    })
  }

  /**
   * Registrar serviço como scoped (uma instância por scope)
   */
  registerScoped<T>(token: string, implementation: Constructor<T> | Factory<T>): void {
    this.services.set(token, {
      lifetime: 'scoped',
      ...(typeof implementation === 'function' && implementation.prototype 
        ? { implementation: implementation as Constructor<T> }
        : { factory: implementation as Factory<T> }
      )
    })
  }

  /**
   * Registrar instância específica
   */
  registerInstance<T>(token: string, instance: T): void {
    this.services.set(token, {
      lifetime: 'singleton',
      instance
    })
  }

  /**
   * Resolver dependência
   */
  resolve<T>(token: string): T {
    const descriptor = this.services.get(token)
    
    if (!descriptor) {
      throw new Error(`Service ${token} not registered`)
    }

    switch (descriptor.lifetime) {
      case 'singleton':
        return this.resolveSingleton(token, descriptor)
      case 'transient':
        return this.resolveTransient(descriptor)
      case 'scoped':
        return this.resolveScoped(token, descriptor)
      default:
        throw new Error(`Invalid service lifetime: ${descriptor.lifetime}`)
    }
  }

  /**
   * Criar novo scope
   */
  createScope(): ScopedContainer {
    return new ScopedContainer(this)
  }

  /**
   * Verificar se serviço está registrado
   */
  isRegistered(token: string): boolean {
    return this.services.has(token)
  }

  /**
   * Limpar instâncias (útil para testes)
   */
  clear(): void {
    this.instances.clear()
    this.scopedInstances.clear()
  }

  private resolveSingleton<T>(token: string, descriptor: ServiceDescriptor<T>): T {
    if (descriptor.instance) {
      return descriptor.instance
    }

    if (this.instances.has(token)) {
      return this.instances.get(token)
    }

    const instance = this.createInstance(descriptor)
    this.instances.set(token, instance)
    return instance
  }

  private resolveTransient<T>(descriptor: ServiceDescriptor<T>): T {
    return this.createInstance(descriptor)
  }

  private resolveScoped<T>(token: string, descriptor: ServiceDescriptor<T>): T {
    if (this.scopedInstances.has(token)) {
      return this.scopedInstances.get(token)
    }

    const instance = this.createInstance(descriptor)
    this.scopedInstances.set(token, instance)
    return instance
  }

  private createInstance<T>(descriptor: ServiceDescriptor<T>): T {
    if (descriptor.factory) {
      return descriptor.factory()
    }

    if (descriptor.implementation) {
      return new descriptor.implementation()
    }

    throw new Error('No implementation or factory provided')
  }
}

/**
 * Container com escopo
 */
export class ScopedContainer {
  private scopedInstances = new Map<string, any>()

  constructor(private parent: Container) {}

  resolve<T>(token: string): T {
    // Verificar se já existe na instância com escopo
    if (this.scopedInstances.has(token)) {
      return this.scopedInstances.get(token)
    }

    // Resolver usando o container pai
    const instance = this.parent.resolve<T>(token)
    
    // Armazenar na instância com escopo se for serviço scoped
    const descriptor = (this.parent as any).services.get(token)
    if (descriptor?.lifetime === 'scoped') {
      this.scopedInstances.set(token, instance)
    }

    return instance
  }

  dispose(): void {
    // Cleanup scoped instances
    this.scopedInstances.clear()
  }
}