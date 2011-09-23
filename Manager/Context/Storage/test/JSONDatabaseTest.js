var database = require('../persist');

// Open non-transactional databse
console.log('OPEN: open database ./data/test.json');
var obj = new database.JSONDatabase({path: './data/test.json', transactional: false});

// Return 'name' from all entries, where 'age' >= 20
var query = {field: "age", compare: "ge", value: 20};
var results = obj.query({where: query, fields: {name: true}});
console.log('QUERY 1: NAME from all entries, where AGE >= 20');
console.log(results);

var query2 = {join: "or", terms: [{field: "name", compare: "equals", value: 'Test'},{field: "age", compare: "le", value: 25}]};
var results2 = obj.query({where: query2});
console.log('QUERY 2: NAME and AGE from all entries, where NAME == test OR AGE <= 25');
console.log(results2);
