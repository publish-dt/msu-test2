var months = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

// нумерация четверостиший Катренов
function tooltipstering(isPrint/* = false*/) {
    if (isPrint === undefined) isPrint = false;

    let counterNumbPoem = 1;
    const pageMain = document.getElementsByClassName('sm-poem-blok'); // page-main
    if (pageMain.length > 0) pageMainEl = pageMain[0];
    let elements = pageMainEl.children;
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i]
        if (element == null) continue

        if (element.className.toLowerCase() === "page-title" || element.className.toLowerCase() === "next") counterNumbPoem = 1;
        if (element.classList.contains("poem")) {
            /*if (!isPrint) {
                element.classList.add('hint--left');
                element.classList.add('hint--no-arrow');
                element.classList.add('hint--no-animate');
            }*/

            element.setAttribute('aria-label', counterNumbPoem);

            counterNumbPoem++;
        }
    }
}
