export function getFroalaEditorConfig(placeholderText: string) {
  return {
    placeholderText,
    charCounterCount: true,
    fontFamily: {
      "Arial,Helvetica,sans-serif": "Arial",
      "Georgia,serif": "Georgia",
      "Impact,Charcoal,sans-serif": "Impact",
      "Tahoma,Geneva,sans-serif": "Tahoma",
      "'Times New Roman',Times,serif": "Times New Roman",
      "Verdana,Geneva,sans-serif": "Verdana",
      "'Courier New',Courier,monospace": "Courier New",
      "'Open Sans',sans-serif": "Open Sans",
      "Roboto,sans-serif": "Roboto",
      "'Source Sans Pro',sans-serif": "Source Sans Pro",
    },
    fontSize: [
      "8px", "10px", "12px", "14px", "16px", "18px", "20px",
      "24px", "28px", "32px", "36px", "48px", "72px",
    ],
    colorsBackground: [
      "#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF",
      "#FFFF00", "#00FFFF", "#FF00FF", "#C0C0C0", "#808080",
      "#800000", "#808000", "#008000", "#800080", "#008080",
      "#000080", "#FFA500", "#FFC0CB", "#FFD700", "#ADD8E6",
      "REMOVE",
    ],
    colorsText: [
      "#FFFFFF", "#000000", "#FF0000", "#00FF00", "#0000FF",
      "#FFFF00", "#00FFFF", "#FF00FF", "#C0C0C0", "#808080",
      "#800000", "#808000", "#008000", "#800080", "#008080",
      "#000080", "#FFA500", "#FFC0CB", "#FFD700", "#ADD8E6",
      "REMOVE",
    ],
    colorsStep: 5,
    colorsDefaultTab: "text",
    linkAlwaysBlank: true,
    linkAlwaysNoFollow: false,
    linkList: [
      { text: "Sitio Web Capuchinos", href: "https://www.capuchinos.org", target: "_blank" },
      { text: "Portal de Formación", href: "https://formacion.capuchinos.org", target: "_blank" },
    ],
    toolbarButtons: {
      moreText: {
        buttons: [
          "bold", "italic", "underline", "strikeThrough", "subscript", "superscript",
          "fontFamily", "fontSize", "textColor", "backgroundColor",
          "inlineClass", "inlineStyle", "clearFormatting",
        ],
        buttonsVisible: 6,
      },
      moreParagraph: {
        buttons: [
          "alignLeft", "alignCenter", "alignRight", "alignJustify",
          "formatOL", "formatUL", "paragraphFormat", "paragraphStyle",
          "lineHeight", "outdent", "indent", "quote",
        ],
      },
      moreRich: {
        buttons: [
          "insertLink", "insertImage", "insertVideo", "insertTable",
          "emoticons", "fontAwesome", "specialCharacters", "embedly",
          "insertFile", "insertHR",
        ],
      },
      moreMisc: {
        buttons: [
          "undo", "redo", "fullscreen", "print", "getPDF", "spellChecker",
          "selectAll", "html", "help",
        ],
      },
    },
    quickInsertButtons: ["table", "ul", "ol", "hr", "link"],
    paragraphFormat: {
      N: "Normal",
      H1: "Título 1",
      H2: "Título 2",
      H3: "Título 3",
      H4: "Título 4",
      PRE: "Código",
    },
    imageAllowedTypes: ["jpeg", "jpg", "png", "gif", "webp"],
    imageMaxSize: 5 * 1024 * 1024,
    imageUploadMethod: "POST",
    events: {
      "image.beforeUpload": function (this: { opts: { imageMaxSize: number } }, files: File[]) {
        if (files[0]?.size > this.opts.imageMaxSize) {
          throw new Error("La imagen es demasiado grande. Máximo 5MB permitido.");
        }
        return false;
      },
    },
    language: "es",
    height: 200,
    heightMax: 400,
    spellcheck: true,
    useClasses: false,
    tabSpaces: false,
    toolbarSticky: false,
    attribution: false,
  };
}
