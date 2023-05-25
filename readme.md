
# Just Another Piece of Cake Storage (JPOX)
#### Reliable, easy-to-use, powerful JSON based storage
###### Current version: v1.0.1

###### This markdown may seem long, but it's a case of extensive documentation, not over-complexity.
***

# Installation
`npm install jpox`

```javascript
const { JPOX } = require("JPOX")
const db = new JPOX(options)
```

***

# JPOX Instance

` var db = new JPOX(options)`

The *options* argument is an object that contains different options for creating the JPOX Database. See the **Options** section below for a detail breakdown of these options.

JPOX works by creating an array (referenced via `JPOX.database`) that's stored internally. The file at `JPOX.options.path` is not written to until the `JPOX.apply()` method is executed. This choice was made to avoid loss of data on server reloads *(such as when writing a file with multiple sets of data using* `nodemon`*.)*

***

#### *options*

`options = {}`

Below are some valid values for for the *options* object:

* `JPOX.options.path`, a string containing a valid path for the location of the JSON file that the JPOX instance will write to/load from.
*default: json data (if defined) ***or*** null*  
<br>

* `JPOX.options.rawJSON`, stringified JSON data. JPOX will prioritize loading database info from this data, if able. 
*default: json data (if defined) ***or*** null*
<br>

* `JPOX.options.alwaysUpdateFirst`, a boolean, used specifically for `JPOX.add(callback, options)`. If set to *true*, then JPOX will always try to update the data in the database before trying to add it. 
*default: false*  
<br>

* `JPOX.options.manipulate`, a function that is used when passed into the `JPOX.add(callback, options)` method. This option is used as the function for `JPOX.options.alwaysUpdateFirst` to look at when calling the `JPOX.update(callback, manipulate, options, fallback)` method. If the `alwaysUpdateFirst` option is specified, then ***all*** add methods must have this specified, unless the option is overridden in within the options passed to the method. A default manipulate function can be set within the database, such as the one below:
```javascript
    (data) => {
        data = newObject
        return data  
    }
```
Passing this function into `manipulate`, along with `alwaysUpdateFirst` would automatically make all add functions check to see if the object exists in the JPOX database first, and if it does, then it will use the function above to overwrite the object in the database with `newObject`. 
*default: null*  
<br>


* `JPOX.options.autoapply`, a boolean. If set to *true*, then JPOX will always save to the JSON file after the database has been written to. Setting this to false and programatically applying changes can be beneficial when using a tool like `nodemon`, where the JSON file can be written once after all changes have been applied, and preventing `nodemon` from restarting prematurely.  
*default: false*
<br>

* `JPOX.options.jsonFormatter`, a string value, either `"prettify"`, or `"compress"`. `"prettify"` will format the JSON file, improving readability. If set to `"compress"`, the JSON file will not be formatted.  
*default: "prettify"*  
<br>

The following options can be passed manually into the JPOX database methods, taking precedence over the option specified upon creation of the JPOX instance:
* `autoapply`
* `alwaysUpdateFirst`
* `manipulate`  

***

# JPOX Data Priority

When creating the JPOX database, JPOX will prioritize certain data:
`options.rawJSON` → `options.path` → `null`
The database will **first** be created from `options.rawJSON`, then `options.path`, before finally calling null and creating an empty database. 

When `options.rawJSON` and `options.path` are used together, the database will be created based off of `options.rawJSON`, then the database will **overwrite** the file located at `options.path`. 

The choice to overwrite the target data rather than save it was made, as the purpose of JPOX is to have *easy* total data control, if the contents of the target database need to be saved and written to from a separate set of source data, it's better to load the database off of the target data, and add the source data through JPOX.

***

# `JPOX.Methods()`


#### `JPOX.update(callback, manipulate, options, fallback)`
Updates the database with new informations, specified in `callback`, and `manipulate`. This is the main JPOX method; depending on your use case, you may never need to use `JPOX.add()`. This method operates in the following order:
<br>  

`callback` - Called first. Function used to locate the data in the JPOX database. This function must return a boolean value when evaluated, or must be set to null. Here are two examples of valid functions (with `manipulate` calls):
<br>

```javascript  
    JPOX.update(x => x.val === 45, data => {
        data.val += 1
        return data
    }, ...)
```

```javascript  
    var myObj = {
        "text": "this line was over the length of 10"
    }

    JPOX.update(function(x) {
        if(x.text.split(" ").length > 10) {
            return true
        }
    }, function(data) {
        data.text = myObj.text
        return data
    }, ...)
```

<br>

`manipulate` - Called second. Expects data to be returned from `callback`. This takes the data returned from callback and allows it to be manipulated using a function. An object must be returned here, as this is the object that will be added back into the database. Below are two examples of functions, with the `manipulate` calls emphasized:  
<br>

```javascript
                              // ↓ manipulate function call 
    JPOX.update(x => x.val > 12, data => {
        data.val = 12
        return data
    }, ...)
```

```javascript
    var myVal = 8

    JPOX.update(function(x) {
        if(x.val > 8) {
            return true
        }
    // ↓ manipulate function call
    }, function(data) {
        data.text = "this.val is over 8"
        return data
    }, ...)
```

<br>

`options` - *optional*, `JPOX.options` specified previously.

<br>

`fallback` - *optional*, called last, function that will be executed in the case that the item cannot be found in the database. Below is an example use case of the `fallback` function:

<br>

```javascript
    var loginUser = {
        name: "Sir John Paul Ignacio Ricardo Montega"
    }

    JPOX.update(x => x.name === loginUser.name, data => {
        data.status = "Active"
        return data
    // | null is here to specify no options are specified
    // ↓     ↓ fallback function call
    }, null, () => {
        JPOX.add({
            name: loginUser.name,
            status: "Active"
        })
    })
```

The `JPOX.update()` method returns an object containing the new data, and the index of the updated object.

<br>

#### `JPOX.get(callback)`

Returns an object stating the value found in the database, as well as the index. Callback must be a function that returns true.

<br>



#### `JPOX.add(callback, options)`

Adds a new object to the JPOX database. `callback` is always an object. If `alwaysUpdateFirst` is set to true in either the JPOX instance's options, or the options passed to the method, then the `manipulate` options ***MUST*** be specified as well. The `prop` option can bes specified to locate the object by a specific property, but if it is not defined, it will go based off of the entire object passed into the `JPOX.add()` method. Below are two examples of the `JPOX.add()` method, one is using a manipulate function, the other is not:

```javascript
    // example without using options
    var myObj = {
        text: "Hello World!",
        val: 12
    }
    JPOX.add(myObj)

    // example with options specified
    JPOX.add(myObj, {
        alwaysUpdateFirst: true, 
        manipulate: function(data) {
            data = myObj
            return data
        },
        prop: myObj.val
    })


    /* 
    returns the object that was passed into it if the call was successful
    */

```

#### `JPOX.delete(callback, options)`

Deletes an object from the database. `callback` is always a function that must return true or false. Valid `options` are: 
* `autoapply`.

```javascript
    JPOX.delete(x => x.title = "DELETEME", {
        autoapply: true
    })

    var deletion = JPOX.delete(x => x.title = "DELETEME", {
        autoapply: true
    })

    console.log(deletion)
    /* 
    returns object 
    {
        result: data,
        dbIndex: `Index checked again. Object at index ${index}.`
    }

    if index is not -1, then the object was not deleted.
    */
```

<br>

#### `JPOX.apply()`

Saves the internally stored database to the JSON file located at `JPOX.options.path`. If `autoapply` was set to false when the JPOX instance was created, then to save anything to the JSON file, this method needs to be called. (Double check this if your database isn't saving).

<br>

#### `JPOX.reload()`

Refreshes the JPOX cache, granting the ability to dodge any server downtime from a reload. This becomes useful in situations such as when using `forever` or `node` to run a server, instead of calling `process.exit(1)`, calling `JPOX.reload()` will refresh JPOX's cache, allowing JPOX to keep the most up to date information. Would usually be called alongside `JPOX.apply()`, since both `forever` and `node` won't automatically refresh the cache after `JPOX.apply()` is called. 

<br>

#### `Array.prototype.methods()`

The JPOX database is stored internally as an array. This means that all Array methods can be called onto `JPOX.database`. For example, here's a codeblock that sorts the database based on the `val` property, then applies the changes to the JSON file:

```javascript
    console.log(JPOX.database)
    /* Array [
        { id: 1, val: 3 },
        { id: 2, val: 1 },
        { id: 3, val: 9 }
    ] */

    JPOX.database.sort((a, b) => a.val - b.val)
    JPOX.apply()

    console.log(JPOX.database)
    /*
    Array [
        { id: 2, val: 1 },
        { id: 1, val: 3 },
        { id: 3, val: 9 }
    ]
    */

```

# Advanced JPOX Use Cases

*** 

JPOX can be used to easily manage multiple, intertwined databases. Since all  arguments to methods (excluding the `JPOX.add()` method) take in a function, we can update two different databases concomitantly. Below is an example of a (simple) book sale system:

```javascript
    const books = new JPOX({
        path: "./db/db1.json"
    })
    const sales = new JPOX({
        path: "./db/db2.json"
    })
    console.log(books.database)
    /* 
        returns Array [
            { book_title: "The Catcher in the Rye", stock: 10 },
            { book_title: "To Kill a Mockingbird", stock: 12}
        ]
    */

   console.log(sales.database)
   /*
        returns Array [
            { type_of_sale: "purchase", title: "To Kill a Mockingbird", qty:2 }
        ]
   */

    var sale = {
        title: "The Catcher in the Rye",
        type_of_sale: "return",
        qty: 1
    }
    
    sales.add({...sale})
    sales.apply()
    sales.reload()
    books.update(book => {
        return book.book_title === sale.title
    }, data => {
        if(sale.type_of_sale === "sale") {
            data.stock -= sale.qty
        } else if (sale.type_of_sale === "return") {
            data.stock += sale.qty
        }
        return data
    }, null, () => {
        // BOOK NOT FOUND IN STOCK
        if(sale.type_of_sale === "sale") {
            books.add({
                book_title: sale.title,
                stock = -(qty) 
            })
        } else if (sale.type_of_sale === "return") {
            books.add({
                book_title: sale.title,
                stock = qty 
            })
        }
    })
```

<br>

This is an example use case of multiple databases being updated conditionally depending on a set of source data. This is a much more complex, in depth use case of JPOX, but it shows the complexity that this system can handle. At the same time, JPOX can also create and amend databases incredibly easily, as showcased below:

```javascript
const options = {
    autoapply: true
}

const db = new JPOX("/db/test.json", options)

// simple update with add fallback
db.update(y => y.text === "this is text", data => {
    data.text = "this is new text"
    return data
}, null, db.add({
    text: "this is a brand new text"
}))

// simple update
db.update(y => y.text === "this is text", data => {
    data.text = "some other text"
    return data
})
```

<br>

As stated before, JPOX is capable of using standard Array methods to manage data. Here are some example use cases of managing data:

```javascript

    // remove everything where the "val" property equals 12
    const db = new JPOX("db/test.json")
    db.database = db.database.filter(item => item.val === 12)
    db.apply()

    // (overly) simple queue system with JPOX
    db.database.pop()
    db.apply()
    db.database.push(newUser)
    db.apply()
```

