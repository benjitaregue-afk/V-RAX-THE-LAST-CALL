import { describe, it, expect } from 'vitest';
import { parseVisualManifest } from '../../src/world/visuals';

describe('optional production visual admission',()=>{
  it('starts with no production model dependency and supports independent shell/prop slots',()=>{
    expect(parseVisualManifest({})).toEqual({});
    expect(parseVisualManifest({environment:'assets/models/archive.glb',terminal:'assets/models/terminal.glb'})).toEqual({environment:'assets/models/archive.glb',terminal:'assets/models/terminal.glb'});
  });
  it('rejects external, traversing, executable and invalid paths before requesting an asset',()=>{
    for(const terminal of ['https://other.example/model.glb','assets/models/../secret.glb','assets/models/run.js','//other.example/a.glb',7,null]){
      expect(()=>parseVisualManifest({terminal})).toThrow();
    }
    for(const value of [null,[],false,'assets/models/test.glb'])expect(()=>parseVisualManifest(value)).toThrow();
  });
  it('ignores keys that cannot instantiate a known slot',()=>{
    expect(parseVisualManifest({unknown:'https://other.example/a.glb'})).toEqual({});
  });
});
