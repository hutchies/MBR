let files;

    let units = [];
    let done = false;
    let output;
    
    async function loadFiles(){
        for(let f of files){
            const arrayBuffer = await f.arrayBuffer();
            //console.log(arrayBuffer);
            let html = await mammoth.convertToHtml({arrayBuffer});
            //console.log(html);
            //result += html.value;
            parseResult(html.value);
        }
        // Now everything is in the units
        let parsed = [];
        let current = false;
        for(let u of units){
            let res = parseUnit(u);
            if(res.citation){
                // New record!
                if(current) parsed.push(current);
                current = {...res};
            }else{
                current = {...current, ...res};
            }
        }
        if(Object.keys(current).length > 0) parsed.push(current);
        console.log('Results parsed', parsed);
        output = JSON.stringify(parsed, null, 2);
        done = true;
    }

    function parseResult(t){
        let [intro, rest] = t.split('</ul>');
        let [main, outro] = rest.split('<table>');
        let matches = main.matchAll(/\<p\>(.+?)\<\/p\>/g);
        for(let m of matches){
            units.push(m[1]);
        }
    }
    


    function parseUnit(u){
        u = u.trim();
        let res = {};
        let types = {
            '[-] ': (s) => {return {citation: s}},
            'Index Classifications: ': (s) => {return {tags: s.split(', ')}},
            'Contributed by: ': (s) => {return {contributors: s.split(', ')}},
            '<a href=\"': (s) => {return {record: s.match(/borrowing\/records\/(\d+)/)[1]}},
            'Works: ': (s) => {return {works: s.split('; ')}},
            'Sources: ': (s) => {return {sources: s.split('; ')}},
        }
        let t = Object.keys(types).find(t => u.startsWith(t));
        if(t){
            let rest = u.slice(t.length).trim();
            return types[t](rest);
        }else{
            // Abstract
            return {annotation: u};
        }
    }