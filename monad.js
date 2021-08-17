// Kata that implements an applicative functor
// for generating "random" values.  Believe it or not, this
// is all written in ES6.
// Based on http://mightybyte.github.io/monad-challenges/

// Some Notation:
//   - function names are in lower case.
//   - parameters to functions are curried
//   - parameters to functions are in lower case.
//   - parameters to functions are named after the type they represent
//   - function parameters are named like (a_b), which would
//     correspond to the type (a -> b).
//   - Return types are noted in comments.
//   - parentheses are used when needed to indicate parameters to functions,
//     however all parameters are also separated by spaces.
//   - Whenever possible only a single expression per function.
//   - Functions are contained in modules.

const Test = {
  expect: label => error => // console effect
    console.log([(error === null) ? 'PASS' : `FAIL (${error})`, '-', label].join(' ')),
  assert: type => a1 => a2 => // error
    (type.eql (a1) (a2)) ? null : [a1, a2].map(a => type.print (a)).join(' : '),
  eql: a1 => a2 => // bool
    a1 === a2,
  print: a => //string
    `${a}`
}

const Num = {
  eql: Test.eql,

  print: Test.print
};
Num.assert = Test.assert (Num);


// Useful list (array) methods
const List = {
  repeat: num => a => // List
    Array(num).fill(a),

  cons: a => listA => // List
    [a].concat (listA),

  instance: a => // bool
    a instanceof Array,

  print: a => // string
    List.instance (a) ? `[${a}]` : `${a}`,

  eql: a1 => a2 => // bool
    [a1, a2].every(a => List.instance (a)) && (`${a1}` === `${a2}`),
};
List.assert = Test.assert (List);

const Tuple = {
  pure: a => b => // tuple
    [a, b],

  assert: List.assert,
}

// Function composition
const Fn = {
  compose: (b_c) => (a_b) => a => // c
    b_c ((a_b) (a)),
};

// Home made infix compose operator :-P
// Use like this:
//   f ["."] (g)
Function.prototype['.'] = function (a_b) { // a_c
  return Fn.compose (this) (a_b); };

// A seed for a random value generator
const Seed = {
  pure: num => // seed
    num,

  assert: Num.assert,
};

// General functions for random values
// A Rand is a tuple with the first element containing the value
// and the second element containing the next seed.
const Rand = {
  // Create a Rand from a value and a seed
  pure: a => seed => // rand
    [a, seed],

  // Apply a function to the `val` portion of a random value
  map: a_b => ([val, seed]) => // rand
    [a_b (val), seed],

  value: rand => // a
    rand[0],

  seed: rand => // seed
    rand[1],

  assert: Tuple.assert
};

// Generates a random value containing a number
// Because this is a kata the value is simple the seed and
// the next seed is simply the current seed + 1
// This means that successive random numbers increment by 1
const RandNum = {
  gen: seed => // rand
    [seed, seed + 1],
};

// Retrun the value of a Rand produced from a GenA given a Seed.
const generate =
      genA => seed => /* a */

      Rand.value (genA (seed));


// Lift the Rand from a GenA and apply a function to its value
const map =
      (A_B) => GenA => /* GenB */

      (Rand.map (A_B)) ['.'] (GenA);


// Apply the next argument to a partially applied function
// Not exactly right... Apply is hard to describe... :-P
const apply =
      GenA_B => GenA => /* GenB */
      {
          let resolve =
              RandGenB => /* RandB */
              (Rand.value (RandGenB)) (Rand.seed (RandGenB));

          return(
              resolve ['.'] (map (f => map (f) (GenA)) (GenA_B))
          );
      };


// Lift 2 random values from generators and apply them to a function
const lift2 =
      (A_B_C) => GenA => GenB => /* GenC */

      apply (map (A_B_C) (GenA)) (GenB);



// Lift a list of generators into a list of random values
const sequence =
      ListGenA => /* GenListA */

      {
          let [x, ...xs] = ListGenA;

          switch (x) {
          case undefined:
              return Rand.pure ([]);

          default:
              return apply (map (List.cons) (x)) (sequence (xs));
          }
      };


const RandEven = {
  // Generates an even random Int given a Seed.
  // Remember: GenNum.gen = seed => // rand
  gen: seed => // rand
    map (x => x * 2) (RandNum.gen),
};

const Letter = {
  fromNum: num => // letter
    String.fromCharCode (num + 64),
};

const RandLetter = {
  gen: seed => // rand
    map (Letter.fromNum) (RandNum.gen),
};

// Generator for a tuple containing a random char and random int
const RandPair = {
  gen: seed => // rand
    lift2 (Tuple.pure) (RandLetter.gen) (RandNum.gen),
};

// Return an array of 5 random Ints.
// With this implementation it should return [1,2,3,4,5]
const fiveRands =
      /* ArrayInt */

      generate (sequence (List.repeat (5) (RandNum.gen))) (Seed.pure (1));


// Return a string of 3 random Chars
// With this implementation it should return 'ABC'
// const randString3 =
//       /* String */
// 
//       (generate (sequence (List.repeat (3) (RandLetter.gen))) (Seed.pure (1))).join('');


Test.expect ('RandNum.gen')
  (Rand.assert (RandNum.gen (Seed.pure (1)))
    ([1, 2]))
Test.expect ('generate')
  (Num.assert (generate (RandNum.gen) (Seed.pure (1)))
    (1))
Test.expect ('RandEven.gen')
  (Rand.assert (RandEven.gen (Seed.pure (1)))
    ([1, 2]))
console.log (RandEven.gen (Seed.pure (1)));
console.log (RandLetter.gen (Seed.pure (1)));
console.log (RandPair.gen (Seed.pure (1)));
console.log (fiveRands);
// console.log (randString3);
