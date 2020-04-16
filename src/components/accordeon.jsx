import React, { Component } from "react";
class Accordeon extends Component {
  state = {};
  render() {
    return (
      <div>
        <h3>{this.props.children}</h3>
        <div className="accordion md-accordion" role="tablist">
          <div class="card">
            {/* <!-- Card header --> */}
            <div class="card-header" role="tab" id="headingTwo1">
              <a
                class="collapsed"
                data-toggle="collapse"
                data-parent="#accordionEx1"
                href="#collapseTwo1"
                aria-expanded="false"
                aria-controls="collapseTwo1"
              >
                <h5 class="mb-0">
                  Collapsible Group Item #1{" "}
                  <i class="fas fa-angle-down rotate-icon"></i>
                </h5>
              </a>
            </div>

            {/* <!-- Card body --> */}
            <div
              id="collapseTwo1"
              class="collapse"
              role="tabpanel"
              aria-labelledby="headingTwo1"
              data-parent="#accordionEx1"
            >
              <div class="card-body">
                Anim pariatur cliche reprehenderit, enim eiusmod high life
                accusamus terry richardson ad squid. 3 wolf moon officia aute,
                non cupidatat skateboard dolor brunch. Food truck quinoa
                nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua
                put a bird on it squid single-origin coffee nulla assumenda
                shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore
                wes anderson cred nesciunt sapiente ea proident. Ad vegan
                excepteur butcher vice lomo. Leggings occaecat craft beer
                farm-to-table, raw denim aesthetic synth nesciunt you probably
                haven't heard of them accusamus labore sustainable VHS.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Accordeon;
