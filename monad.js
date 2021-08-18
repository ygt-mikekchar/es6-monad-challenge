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

// Prelude
// This contains useful tools for the rest of the file
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

const Obj = {
  eql: Test.eql,

  print: Test.print
};
Obj.assert = Test.assert (Obj);

const Num = {
  assert: Obj.assert,
};


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

// Monad Code

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

const Gen = {
  // Apply a Seed to a Gen and return the value of the resultant Rand
  value: genA => seed => // a
    Rand.value (genA (seed)),

  // Lift the Rand from a Gen and apply a function to its value
  map: a_b => genA => // gen_b
    (Rand.map (a_b)) ['.'] (genA),

  // Lift 2 random values from generators and apply them to a function
  lift2: a_b_c => genA => genB => // genC
    Gen.apply (Gen.map (a_b_c) (genA)) (genB),

  // Apply the next argument to a partially applied function
  // Not exactly right... Apply is hard to describe... :-P
  apply: genA_B => genA => // GenB
    {
        let resolve =
            randGenB => /* randB */
            (Rand.value (randGenB)) (Rand.seed (randGenB));

        return(
            resolve ['.'] (Gen.map (a_b => Gen.map (a_b) (genA)) (genA_B))
        );
    },

  // Lift a list of generators into a list of random values
  sequence: listGenA => // genListA
    {
        let [genA, ...genAs] = listGenA;

        switch (genA) {
        case undefined:
            return Rand.pure ([]);

        default:
            return Gen.apply (Gen.map (List.cons) (genA)) (Gen.sequence (genAs));
        }
    },
}

const RandEven = {
  // Generates an even random Int given a Seed.
  // Remember: GenNum.gen = seed => // rand
  gen: // seed => rand
    Gen.map (x => x * 2) (RandNum.gen),
};

const Letter = {
  fromNum: num => // letter
    String.fromCharCode (num + 64),

  assert: Test.assert,
};

const RandLetter = {
  gen: // seed => rand
    Gen.map (Letter.fromNum) (RandNum.gen),
};

// Generator for a tuple containing a random char and random int
const RandPair = {
  gen: // seed => rand
    Gen.lift2 (Tuple.pure) (RandLetter.gen) (RandNum.gen),
};

// Return an array of 5 random Ints.
// With this implementation it should return [1,2,3,4,5]
const fiveRands =
      /* ArrayInt */

      Gen.value (Gen.sequence (List.repeat (5) (RandNum.gen))) (Seed.pure (1));


// Return a string of 3 random Chars
// With this implementation it should return 'ABC'
const randString3 =
      /* String */

      (Gen.value (Gen.sequence (List.repeat (3) (RandLetter.gen))) (Seed.pure (1))).join('');

// Tests

Test.expect ('RandNum.gen')
  (Rand.assert (RandNum.gen (Seed.pure (1)))
    ([1, 2]));

Test.expect ('Gen.value')
  (Num.assert (Gen.value (RandNum.gen) (Seed.pure (1)))
    (1));

Test.expect ('Rand.map')
  (Rand.assert (Rand.map (x => x * 2) ([1, 2]))
    ([2, 2]));

Test.expect ('RandEven.gen')
  (Rand.assert (RandEven.gen (Seed.pure (1)))
    ([2, 2]));

Test.expect ('RandLetter.gen')
  (Rand.assert (RandLetter.gen (Seed.pure (1)))
    (['A', 2]));

// FIXME: Test compares the wrong thing
//        Make it fail to see what's wrong
Test.expect ('RandPair.gen')
  (Tuple.assert (RandPair.gen (Seed.pure (1)))
    ([['A', 2], 3]));

Test.expect ('fiveRands') (List.assert (fiveRands) ([1, 2, 3, 4, 5]));

Test.expect ('randString3') (Obj.assert (randString3) ('ABC'));
