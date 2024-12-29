// BleAdapter

export { default as BleDeviceAdapter } from './components/BleDeviceAdapter'
export * from './components/BleDeviceAdapter'

export { default as SpyBleAdapter } from './testDoubles/BleAdapter/SpyBleAdapter'
export * from './testDoubles/BleAdapter/SpyBleAdapter'

export { default as FakeBleAdapter } from './testDoubles/BleAdapter/FakeBleAdapter'
export * from './testDoubles/BleAdapter/FakeBleAdapter'

// BleScanner

export { default as BleDeviceScanner } from './components/BleDeviceScanner'
export * from './components/BleDeviceScanner'

export { default as SpyBleScanner } from './testDoubles/BleScanner/SpyBleScanner'
export * from './testDoubles/BleScanner/SpyBleScanner'

export { default as FakeBleScanner } from './testDoubles/BleScanner/FakeBleScanner'
export * from './testDoubles/BleScanner/FakeBleScanner'

// noble

export { default as SpyCharacteristic } from './testDoubles/noble/SpyCharacteristic'
export * from './testDoubles/noble/SpyCharacteristic'

export { default as FakeCharacteristic } from './testDoubles/noble/FakeCharacteristic'
export * from './testDoubles/noble/FakeCharacteristic'

export { default as FakeNoble } from './testDoubles/noble/FakeNoble'
export * from './testDoubles/noble/FakeNoble'

export { default as FakePeripheral } from './testDoubles/noble/FakePeripheral'
export * from './testDoubles/noble/FakePeripheral'
