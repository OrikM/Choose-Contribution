class Application {
  /*generates the result of button click. gets the results of input data.*/
  constructor() {
      const selectButton = document.getElementById('calculate');
      selectButton.addEventListener('click', this.handleButtonClick.bind(this));
  }

  handleButtonClick() {
      const startAmount = document.getElementById('startSum').value;
      const monthlyPayment = document.getElementById('monincrease').value;
      const term = document.getElementById('term').value;
      const currency = document.getElementById('currency').value;
      const container = document.querySelector('table');

      const clientQueue = new Deposit(startAmount, monthlyPayment, term, currency);
      if (clientQueue.check) {
          const bestOffer = new BankProduct(clientQueue);
          const calculator = new Calculator(bestOffer, clientQueue);
          const table = calculator.getTable();

          if (table.length === 1) {
              container.innerHTML = 'Нет подходящих результатов!';
          } else {
              container.innerHTML = table.join('');
          }
      }else{
          container.innerHTML = '';
      }
  }
}

class Calculator {
  /* initialized by the array of BankProducts , generates the table and calculates final amount */
  constructor(bestOffer, { startAmount, monthlyPayment, term, currency }) {
      this.bestOffer = bestOffer;
      this.startAmount = startAmount;
      this.monthlyPayment = monthlyPayment;
      this.term = term;
      this.currency = currency;
  }
  getTable() {
      const self = this;
      const bestOffer = this.bestOffer;
      return this.generateTable(bestOffer, self);
  }
  generateTable(bestOffer, clientInput) {
      const table = [];
      table[0] = '<tr><th>Название банка</th><th>Вклад</th><th>Процент</th><th>Итоговая сумма</th></tr>';
      for (let i = 0; i < bestOffer.length; i++) {
          let bankName = bestOffer[i].bankName;
          let investName = bestOffer[i].investName;
          let percent = bestOffer[i].incomeType;
          let finalAmount = this.calculateFinalAmount(bestOffer[i], clientInput);
          table.push(this.generateRow(bankName, investName, percent, finalAmount));
      }
      return table;
  }
  generateRow(bankName, investName, percent, finalAmount) {
      const bankNameTdata = '<td>' + bankName + '</td>';
      const investNameTdata = '<td>' + investName + '</td>';
      const percentTdata = '<td>' + percent + '</td>';
      const finalAmountTdata = '<td>' + finalAmount + '</td>';

      let row = '<tr>' + bankNameTdata + investNameTdata + percentTdata + finalAmountTdata + '</tr>';
      return row;
  }
  calculateFinalAmount(offer, clientInput) {
      let finalAmount = clientInput.startAmount;
      for (let i = 0; i < clientInput.term; i++) {
          if (i < clientInput.term-1) {
              finalAmount += finalAmount * offer.incomeType / 100 / 12 + clientInput.monthlyPayment;
          } else {
              finalAmount += finalAmount * offer.incomeType / 100 / 12;
          }
      }
      return Math.round(finalAmount);
  }
}

class BankProduct {
  /* gets data of offered bank products according inserted data */
  constructor({ startAmount, monthlyPayment, term, currency }) {
      const data = JSON.parse(tableData);
      const product = { startAmount, monthlyPayment, term, currency };

      return this.filterProduct(data, product);
  }
  filterProduct(data, product) {
      //  returns filtered offers for all cases
      let currencyFilter = this.filterForCurrency(data, product);
      let isPaymentFilter = this.filterForPayment(currencyFilter, product);
      let minTermFilter = this.filterForMinPeriod(isPaymentFilter, product);
      let maxTermFilter = this.filterForMaxPeriod(minTermFilter, product);
      let minAmountFilter = this.filterForMinAmount(maxTermFilter, product);
      let maxAmountFilter = this.filterForMaxAmount(minAmountFilter, product);

      const maxPercent = this.getMaxPercent(maxAmountFilter);
      const bestOffer = this.getBestSuggestions(maxAmountFilter, maxPercent);
      return bestOffer;
  }
  filterForCurrency(data, product) {
      // filters by currency
      return data.filter(offer => {
          return offer.currency === product.currency;
      });
  }
  filterForPayment(data, product) {
      // filters for eligibility of monthly payments
      if (product.monthlyPayment > 0) {
          return data.filter(offer => {
              return offer.canDeposit === true;
          });
      } else {
          return data;
      }
  }
  filterForMinAmount(data, product) {
      // filters by minimal dbit balance
      return data.filter(offer => {
          return product.startAmount >= offer.sumMin;
      });
  }
  filterForMaxAmount(data, product) {
      // filters by maximal debit balance
      return data.filter(offer => {
          if (offer.sumMax != null) {
              let calculate = new Calculator(offer, product);
              let finalAmount = calculate.calculateFinalAmount(offer, product);
              return finalAmount <= offer.sumMax;
          } else {
              return true;
          }
      });
  }
  filterForMinPeriod(data, product) {
      //filters by minimal period of time (months)
      return data.filter(offer => {
          return product.term >= offer.termMin;
      });
  }
  filterForMaxPeriod(data, product) {
      // filters by maximum period of time (months)
      return data.filter(offer => {
          return product.term <= offer.termMax;
      });
  }
  getMaxPercent(offeredList) {
      // returns max possible rate
      const rateList = offeredList.reduce((result, offer) => {
          result.push(offer.incomeType);
          return result;
      }, []);
      return Math.max.apply(null, rateList);
  }
  getBestSuggestions(offeredList, maxPercent) {
      // returns best suggestion by its percent
      return offeredList.filter(offer => {
          return offer.incomeType === maxPercent;
      });
  }
}

class Deposit {
  // realize properties and functionality of deposit account, that clients wants to open
  constructor(startAmount, monthlyPayment, term, currency) {
      this.startAmount = startAmount;
      this.monthlyPayment = monthlyPayment;
      this.term = term;
      this.currency = currency;
      this.check = true;

      if (this.findError() != '') {
          alert(this.findError());
          this.check = false;
      }
  }
  findError() { //finds errors
      let errorLog = '';
      if(!this.startAmount || !this.monthlyPayment || !this.term){
          errorLog += 'Все поля должны быть заполнены.\n';
      }
      if (this.startAmount < 0 || isNaN(+this.startAmount)) {
          errorLog += 'Начальная сумма должна быть не отрицательным числом.\n';
      }
      if (this.monthlyPayment < 0 || isNaN(+this.monthlyPayment)) {
          errorLog += 'Сумма ежемесячного пополнения должна быть не отрицательным числом.\n';
      }
      if (this.term < 0 || Math.trunc(this.term) != this.term || isNaN(+this.term)) {
          errorLog += 'Срок вклада должна быть положительным целым числом.\n';
      }
      this.startAmount = +this.startAmount;
      this.monthlyPayment = +this.monthlyPayment;
      this.term = +this.term;
      return errorLog;
  }
}
new Application();


