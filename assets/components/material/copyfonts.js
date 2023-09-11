import fs from 'node:fs';
import path from 'node:path';
import {glob} from 'glob';


let {output} = JSON.parse(fs.readFileSync('rollup.json',{encoding: 'utf-8'}));


output = path.resolve(output[0], 'files');
console.debug(output);
if(!fs.existsSync(output)){
     fs.mkdirSync(output, {recursive: true});
}

glob.sync('node_modules/@fontsource/*/files/*.woff*').forEach(file=>{

    const
        source = path.resolve(file),
        dest = path.resolve(output, path.parse(file).base);
    if(!fs.existsSync(dest)){
        console.log('Installing font', path.parse(dest).name);
        fs.copyFileSync(source,dest);
    }
});


