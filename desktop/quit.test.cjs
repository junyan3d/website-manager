const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
test('Command-Q immediately stops the worker and quits without confirmation, including a busy worker',()=>{
  const calls=[];
  const app={isPackaged:false,requestSingleInstanceLock:()=>true,whenReady:()=>({then:()=>{}}),on:()=>{},quit:()=>calls.push('quit')};
  const electron={app,dialog:{showMessageBox:()=>{throw Error('Unexpected confirmation');}}};
  const sandbox={require:name=>name==='electron'?electron:require(name==='./project.cjs'?path.join(__dirname,'project.cjs'):name),__dirname,process,console,setTimeout};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'main.cjs'),'utf8'),sandbox);
  sandbox.workerStub={kill:()=>calls.push('kill')};
  vm.runInContext("worker=workerStub; origin='http://127.0.0.1:1234'; stopping=true; quitImmediately();",sandbox);
  assert.deepEqual(calls,['kill','quit']);
  assert.equal(vm.runInContext('quitting && worker === null && origin === ""',sandbox),true);
});
