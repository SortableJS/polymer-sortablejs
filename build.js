const DISABLED_PROPERTIES = [
  'draggable',
  'setData',
  'supportPointer'
];


const fsCallbacks = require('fs'),
      path = require('path'),
      https = require('https'),
      promisify = require('util').promisify;

const fs = {
  stat: promisify(fsCallbacks.stat),
  readFile: promisify(fsCallbacks.readFile),
  writeFile: promisify(fsCallbacks.writeFile)
};

// From https://stackoverflow.com/a/17676794/6166832
function donwload(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fsCallbacks.createWriteStream(dest),
          request = http.get(url, response => {
      response.pipe(file);
      file.on('finish', () => file.close(reslove));
    });
  });
}


// Look for bower_components
fs.stat('bower_components/Sortable/Sortable.js').then(stat => {
  loadFromFile('bower_components/Sortable/Sortable.js');
}, err => {
  if (err.code !== 'ENOENT') throw err
    else {
      // Look a level deeper
      fs.stat('../bower_components/Sortable/Sortable.js').then(stat => {
        loadFromFile('../bower_components/Sortable/Sortable.js');
      }, err => {
        if (err.code !== 'ENOENT') throw err
        // Look in node_modules
          else fs.stat('node_modules/Sortable/Sortable.js').then(stat => {
            loadFromFile('node_modules/Sortable/Sortable.js');
          }, err => {
            if (err.code !== 'ENOENT') throw err
            // Look in node_modules but deeper
              else fs.stat('../node_modules/Sortable/Sortable.js').then(stat => {
                loadFromFile('../node_modules/Sortable/Sortable.js');
              }, err => {
                if (err.code !== 'ENOENT') throw err
                  else {
                    downloadFromGit();
                  }
              });
          });
      });
    }
});


async function loadFromFile(filePath) {
  const file = await fs.readFile(path.join(__dirname, filePath), 'utf8');
  proceed(file);
}

async function downloadFromGit() {
  const gitUsername = process.argv.includes('-u')
    ? process.argv[process.argv.indexOf('-u') + 1] : 'RubaXa';
  const gitBranch = process.argv.includes('-b')
    ? process.argv[process.argv.indexOf('-b') + 1] : 'master';
  https.get(`https://raw.githubusercontent.com/${gitUsername}/Sortable/${gitBranch}/Sortable.js`, resp => {
    let data = '';
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      proceed(data);
    });
  }).on("error", err => {
    console.trace(err);
    throw new Error('Couldn\'t get Sortable.js');
  });
}

async function proceed(string) {
  // Get options from source code of Sortblejs
  const optionsString = /var\s+defaults\s*=\s*{\s*(([^:]+:[^,}]+)+\s*)}/m.exec(string)[1],
        optionsStringSplit = optionsString.split(''),
        optionsArray = [];
  // Read them into an array [ key, value, key, value... ]
  let current = '',
      depthLevel = 0,
      depthExpectColon = false,
      depthStringOpen = false;
  for (let i in optionsStringSplit) {
    const character = optionsStringSplit[i];
    if (character === '{'
      || (character === '\'' && !depthStringOpen) || (character === '"' && !depthStringOpen)
      || character === '?'
      || character === '(') {
      depthLevel++;
      if (character === '?') depthExpectColon = true;
      if (character === '\'' || character === '"') depthStringOpen = true;
      if (depthLevel > 0) current += character;
    } else if (character === '}'
      || (character === '\'' && depthStringOpen) || (character === '"' && depthStringOpen)
      || (depthExpectColon && character === ':')
      || character === ')') {
      depthLevel--;
      if (character === ':') depthExpectColon = false;
      if (character === '\'' || character === '"') depthStringOpen = false;
      if (depthLevel >= 0) current += character;
    } else if ((character === ','
      || character === ':')
      && depthLevel === 0) {
      optionsArray.push(current);
      current = '';
    } else if (depthLevel > 0 || /[^\s:,]/.test(character)) {
      current += character;
    }
    if (depthLevel < 0) {
      optionsArray.push(current);
      break;
    }
  }
  // Throw if read options aren't even
  if (optionsArray.length % 2) {
    console.log('Options that were read:', optionsArray);
    throw new Error('Something went wrong when reading options');
  }
  // Process the array to attach types
  const computedOptions = {};
  let key, value, type;
  optionsArray.forEach((item, index) => {
    index % 2 ? value = item : key = item;
    if (value && key) {
      if (!DISABLED_PROPERTIES.includes(key)) {
        if (value === 'false' || value === 'true') type = 'Boolean'
        else if (Number(value) !== NaN) type = 'Number'
        else if (/$\s*\{/.test(value)) type = 'Object'
        else if (/$\s*\[/.test(value)) type = 'Array'
        else type = 'String'
        computedOptions[key] = { value, type };
      }
      key = value = type = null;
    }
  });
  
  // Get template file
  const template = await fs.readFile(path.join(__dirname, 'polymer-sortablejs-template.html'), 'utf8');
  let generatedTemplate = template;

  // Generate properties
  generatedTemplate = generatedTemplate.replace(/^(\s*)\/\*properties\*\//m, (_, spacing) => {
    let output = '';
    for (key in computedOptions) {
      const type = computedOptions[key].type,
            value = computedOptions[key].value;
      output += `${spacing}${key}: { type: ${type}, value: function() { return ${value} }, observer: '${key}Changed' },\n`
    }
    return output.slice(0, -2);
  });

  // Generate observers
  generatedTemplate = generatedTemplate.replace(/^(\s*)\/\*propertyobservers\*\//m, (_, spacing) => {
    let output = '';
    for (key in computedOptions) {
      if (!new RegExp(key + 'Changed').test(template))
        output += `${spacing}${key}Changed: function(value) { this.sortable && this.sortable.option("${key}", value); },\n`
    }
    return output.slice(0, -2);
  });

  await fs.writeFile(path.join(__dirname, 'polymer-sortablejs.html'), generatedTemplate, 'utf8');
}