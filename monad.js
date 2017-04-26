// Kata that implements an applicative functor
// for generating "random" values.  Believe it or not, this
// is all written in ES6.
// Based on http://mightybyte.github.io/monad-challenges/

// Some Notation:
//   - function names are in lower case.
//   - parameters to functions are curried
//   - parameters to functions are in *upper* case.
//   - parameters to functions are named after the type they represent
//   - function parameters are named like (A_B), which would
//     correspond to the type (a -> b).
//   - Return types are noted in comments.
//   - parentheses are used when needed to indicate parameters to functions,
//     however all parameters are also separated by spaces.

// Function composition
const compose =
      (B_C) => (A_B) => A => /* C */

      B_C ((A_B) (A));

// Home made infix compose operator :-P
// Use like this:
//   f ["."] (g)
Function.prototype['.'] =
    function(A_B) {
        return compose (this) (A_B);
    };


// Return a "random" value given a seed.
// This returns an record with `val` holding the "random" value
// and `seed` holding the next seed.
// Because this is a kata, my "random" number generator just returns
// the value of the given seed and then increments the seed.
const randInt =
      Seed => /* RandInt */
      // Note this signature is equivalent to GenInt

      ({ val: Seed, seed: Seed + 1 });


// Apply a function to the `val` portion of a random value
const mapRand =
      (A_B) => RandA => /* RandB */

      ({ val: A_B (RandA.val), seed: RandA.seed });


// Create a seed.  Currently implemented as an Int.
const mkSeed =
      Int => /* Seed */
      Int;


// Retrun the `val` protion of a Rand produced from a GenA given a Seed.
const generate =
      GenA => Seed => /* A */

      (GenA (Seed)).val;


// Lift the Rand from a GenA and apply a function to its `val`
const map =
      (A_B) => GenA => /* GenB */

      (mapRand (A_B)) ['.'] (GenA);


// Apply the next argument to a partially applied function
// Not exactly right... Apply is hard to describe... :-P
const apply =
      GenA_B => GenA => /* GenB */
      {
          let resolve =
              RandB => /* RandB */
              RandB.val (RandB.seed);

          return(
              resolve ['.'] (map (f => map (f) (GenA)) (GenA_B))
          );
      };


// Wrap a value so that the generator produces that value
// when given a seed.
// It seems a bit counterintuitive that this is needed, but
// you need it for initialising wrapped arrays, etc.
// This will *always* be used by currying the first parameter
// resulting a function that returns a GenA
const pure =
      A => Seed => /* RandA */

      ({ val: A, seed: Seed });


// Lift 2 random values from generators and apply them to a function
const lift2 =
      (A_B_C) => GenA => GenB => /* GenC */

      apply (map (A_B_C) (GenA)) (GenB);


// A few list functions that I need.
const List = {
    repeat:
    Int => A => /* ListA */

    Array(Int).fill(A),

    head:
    ListA => /* A */

    ListA[0],

    tail:
    ListA => /* ListA */

    ListA.slice (1),

    cons:
    A => ListA => /* ListA */

    [A].concat (ListA)
};

// Lift a list of generators into a list of random values
const sequence =
      ListGenA => /* GenListA */

      {
          let x = List.head (ListGenA);
          let xs = List.tail (ListGenA);

          switch (x) {
          case undefined:
              return pure ([]);

          default:
              return apply (map (List.cons) (x)) (sequence (xs));
          }
      };


// Generates an even random Int given a Seed.
// Remember: GenInt == Seed => /* RandInt */
const randEven =
      /* GenInt */

      map (x => x * 2) (randInt);


// Return a "random" letter
// Remember: GenChar == Seed => /* RandChar */
const randChar =
      /* GenChar */
      function() {
          let toChar =
              Int => /* Char */

              String.fromCharCode (Int + 64);

          return(
              map (toChar) (randInt)
          );
      }();


// Generator for a tuple containing a random char and random int
const randPair =
      /* GenCharInt */
      function() {
          let newTuple =
              A => B => /* TupleAB */

              ({first: A, second: B});

          return(
              lift2 (newTuple) (randChar) (randInt)
          );
      }();


// Return an array of 5 random Ints.
// With this implementation it should return [1,2,3,4,5]
const fiveRands =
      /* ArrayInt */

      generate (sequence (List.repeat (5) (randInt))) (mkSeed (1));


// Return a string of 3 random Chars
// With this implementation it should return 'ABC'
const randString3 =
      /* String */

      (generate (sequence (List.repeat (3) (randChar))) (mkSeed (1))).join('');


// Can't be bothered writing real tests.  Just outputting
// Some values to make sure it isn't broken.

console.log (randInt (mkSeed (1)));
console.log (generate (randInt) (mkSeed (1)));
console.log (randEven (mkSeed (1)));
console.log (randChar (mkSeed (1)));
console.log (randPair (mkSeed (1)));
console.log (fiveRands);
console.log (randString3);
