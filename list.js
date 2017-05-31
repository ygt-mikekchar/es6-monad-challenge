// Useful list (array) methods

const repeat = Int => A => // ListA
      Array(Int).fill(A);

const cons = A => ListA => // ListA
      [A].concat (ListA);

module.exports = {
    repeat: repeat,
    cons: cons
};
