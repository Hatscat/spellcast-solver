const config = {
  rows: 5,
  cols: 5,
  solutionMinLength: 4,
  solutionMaxLength: 7,
  letterPoints: {
    a: 1,
    b: 4,
    c: 5,
    d: 3,
    e: 1,
    f: 5,
    g: 3,
    h: 4,
    i: 1,
    j: 7,
    k: 6,
    l: 3,
    m: 4,
    n: 2,
    o: 1,
    p: 4,
    q: 8,
    r: 2,
    s: 2,
    t: 2,
    u: 4,
    v: 5,
    w: 5,
    x: 7,
    y: 4,
    z: 8,
  },
};

/** @typedef {{value: string, cellIndexes: number[], points: number}} Word */

const state = {
  /** @type {Word[]} */
  words: [],
};

const elements = {
  /** @type {Array<LM & HTMLInputElement>} */
  cells: [],
  /** @type {LM | undefined} */
  solutionsContainer: undefined,
};

onload = () => {
  elements.cells = /** @type {Array<LM & HTMLInputElement>} */ (
    range(config.rows * config.cols).map(cell)
  );
  elements.solutionsContainer = lm("div", {
    className: "m-4 flex flex-wrap gap-2",
  })();
  document.body.appendChild(pageLayout());
};

onkeyup = (e) => {
  if (e.key === "Enter") solveGrid();
};

function pageLayout() {
  return lm(
    "div",
    {}
  )([
    lm("div", {
      className: "flex mt-4 w-screen justify-center items-center gap-16",
    })([
      lm("div", {
        className: "inline-grid grid-cols-5 gap-4",
      })(elements.cells),
      lm("div", { className: "flex flex-col gap-4" })([
        lm("button", {
          className: "bg-red-500 text-white px-4 py-2 rounded-md",
          onclick: clearGrid,
        })("Clear"),
        lm("button", {
          className: "bg-green-500 text-white px-4 py-2 rounded-md",
          onclick: solveGrid,
        })("Solve"),
      ]),
    ]),
    elements.solutionsContainer,
  ]);
}

/**
 * @param {number} index
 */
function cell(index) {
  return lm("input", {
    className:
      " border-2 border-black w-16 h-16 text-center uppercase font-bold",
    oninput: (e) => {
      e.preventDefault();
      const ev = /** @type {(InputEvent)} */ (e);
      const input = /** @type {(HTMLInputElement)} */ (ev.target);

      if (
        !ev.data ||
        !"ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(ev.data.toUpperCase())
      ) {
        input.value = "";
        return;
      }
      input.value = ev.data.toUpperCase();

      elements.cells[(index + 1) % elements.cells.length].focus();
    },
    // })("");
  })("ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]);
}

/**
 * @param {Word} word
 * @returns {LM} solution element
 */
function solution({ value, cellIndexes, points }) {
  const highlightClass = "bg-green-300";
  const selectClass = "invert";
  return lm("div", {
    className: "flex bg-gray-200 p-2 rounded-md hover:bg-green-300",
    onmouseover: () => {
      cellIndexes.forEach((index) => {
        elements.cells[index].classList.add(highlightClass);
      });
    },
    onmouseout: () => {
      cellIndexes.forEach((index) => {
        elements.cells[index].classList.remove(highlightClass);
      });
    },
    onclick: () => {
      elements.cells.forEach((cell) => {
        cell.classList.remove(selectClass);
      });
      cellIndexes.forEach((index) => {
        elements.cells[index].classList.add(selectClass);
      });
    },
    ondblclick: () => {
      cellIndexes.forEach((index) => {
        elements.cells[index].value = "";
        elements.cells[index].classList.remove(selectClass);
      });
    },
  })([
    lm("span", { className: "font-bold" })(value),
    lm("span", { className: "ml-2" })(`(${points})`),
  ]);
}

function solveGrid() {
  state.words = [];
  elements.cells.forEach((_, index) => {
    browseAvailableWords("", index);
  });

  state.words.sort((a, b) => b.points - a.points);

  elements.solutionsContainer?.replaceContent(
    state.words.length > 0
      ? state.words.map(solution)
      : lm("span", { className: "m-auto text-2xl text-red-500" })(
          "No solution found"
        )
  );
}

/**
 * @param {string} word
 * @returns {number}
 */
function getWordPoints(word) {
  return word
    .split("")
    .map(
      (letter) =>
        config.letterPoints[
          /** @type {keyof typeof config.letterPoints} */ (letter)
        ]
    )
    .reduce((a, b) => a + b, 0);
}

/**
 * @param {string} currentWord
 * @param {number} cellIndex
 * @param {number[]} indexesPath
 * @returns
 */
function browseAvailableWords(currentWord, cellIndex, indexesPath = []) {
  const linkedIndexes = getLinkedIndexes(cellIndex).filter(
    (index) => !indexesPath.includes(index)
  );

  if (
    currentWord.length >= config.solutionMaxLength ||
    linkedIndexes.length === 0 ||
    elements.cells[cellIndex].value === ""
  ) {
    return;
  }

  const wordPath = [...indexesPath, cellIndex];

  const wordValue = currentWord + elements.cells[cellIndex].value;

  if (wordValue.length >= config.solutionMinLength) {
    const value = wordValue.toLowerCase();
    if (window.DICTIONARY?.has(value)) {
      state.words.push({
        value,
        cellIndexes: wordPath,
        points: getWordPoints(value),
      });
    }
  }
  linkedIndexes.forEach((index) => {
    browseAvailableWords(wordValue, index, wordPath);
  });
}

function clearGrid() {
  elements.cells.forEach((cell) => cell.replaceContent(""));
}

/**
 * @param {number} index
 * @returns {number[]}
 * */
function getLinkedIndexes(index) {
  const isOnTop = index < config.cols;
  const isOnBottom = index >= config.cols * (config.rows - 1);
  const isOnLeft = index % config.cols <= 0;
  const isOnRight = index % config.cols >= config.cols - 1;

  const indexes = [];
  if (!isOnTop) {
    indexes.push(index - config.cols);
    if (!isOnLeft) indexes.push(index - config.cols - 1);
    if (!isOnRight) indexes.push(index - config.cols + 1);
  }
  if (!isOnBottom) {
    indexes.push(index + config.cols);
    if (!isOnLeft) indexes.push(index + config.cols - 1);
    if (!isOnRight) indexes.push(index + config.cols + 1);
  }
  if (!isOnLeft) indexes.push(index - 1);
  if (!isOnRight) indexes.push(index + 1);
  return indexes;
}

/**
 * @param {number} length
 * @returns
 */
function range(length) {
  return [...Array(length).keys()];
}

/**
 * @typedef {HTMLElement | string | undefined | Array<HTMLElement |  string | undefined>} LmContent
 * @typedef {HTMLElement & { addContent: (c: LmContent) => LM, replaceContent: (c: LmContent) => LM }} LM
 */

/**
 * @param {keyof HTMLElementTagNameMap} type
 * @param {(Partial<HTMLElement> & Record<string, unknown>)=} attributes
 * @returns {(content: LmContent=) => LM} element builder
 */
function lm(type, attributes) {
  return (content) => {
    const element = Object.assign(document.createElement(type), {
      ...attributes,
      /** @param {LmContent} c */
      addContent: (c) => {
        if (c) {
          if (typeof c === "object" && "appendChild" in c)
            element.appendChild(c);
          else if (Array.isArray(c)) c.forEach(element.addContent);
          else if (element instanceof HTMLInputElement) element.value += c;
          else element.innerText += c;
        }
        return element;
      },
      /** @param {LmContent} c */
      replaceContent: (c) => {
        while (element.firstChild) element.removeChild(element.firstChild);
        if (element instanceof HTMLInputElement) element.value = "";
        return element.addContent(c);
      },
    });
    return element.addContent(content);
  };
}
