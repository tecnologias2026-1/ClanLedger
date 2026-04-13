// =======================
// MODAL MIEMBROS
// =======================

const btnAbrir = document.getElementById("abrirModal");
const modal = document.getElementById("modalMiembro");
const cerrar = document.getElementById("cerrarModal");

if(btnAbrir && modal && cerrar){

  btnAbrir.addEventListener("click", function(){
    modal.style.display = "flex";
  });

  cerrar.addEventListener("click", function(){
    modal.style.display = "none";
  });

  modal.addEventListener("click", function(e){
    if(e.target === modal){
      modal.style.display = "none";
    }
  });
}


// =======================
// COLORES
// =======================

const colores = document.querySelectorAll(".color");
let colorSeleccionado = null;

colores.forEach(color => {
  color.addEventListener("click", function(){

    colores.forEach(c => c.classList.remove("selected"));

    this.classList.add("selected");

    colorSeleccionado = this.getAttribute("data-color");

    console.log("Color seleccionado:", colorSeleccionado);
  });
});


// =======================
// MODAL CUENTAS
// =======================

const btnCuenta = document.getElementById("abrirModalCuenta");
const modalCuenta = document.getElementById("modalCuenta");
const cerrarCuenta = document.getElementById("cerrarModalCuenta");

if(btnCuenta && modalCuenta && cerrarCuenta){

  btnCuenta.addEventListener("click", function(){
    modalCuenta.style.display = "flex";
  });

  cerrarCuenta.addEventListener("click", function(){
    modalCuenta.style.display = "none";
  });

  modalCuenta.addEventListener("click", function(e){
    if(e.target === modalCuenta){
      modalCuenta.style.display = "none";
    }
  });
}


// =======================
// MODAL ELIMINAR
// =======================

const btnEliminar = document.getElementById("abrirEliminar");
const modalEliminar = document.getElementById("modalEliminar");
const cancelarEliminar = document.getElementById("cancelarEliminar");
const confirmarEliminar = document.getElementById("confirmarEliminar");

if(btnEliminar && modalEliminar){

  // ABRIR
  btnEliminar.addEventListener("click", function(){
    modalEliminar.style.display = "flex";
  });

  // CANCELAR
  cancelarEliminar.addEventListener("click", function(){
    modalEliminar.style.display = "none";
  });

  // CLICK AFUERA
  modalEliminar.addEventListener("click", function(e){
    if(e.target === modalEliminar){
      modalEliminar.style.display = "none";
    }
  });

  // CONFIRMAR (aquí pasa la magia 💀)
  confirmarEliminar.addEventListener("click", function(){

    // ejemplo: borrar todo visualmente
    document.querySelector(".members").innerHTML = "";
    document.querySelector(".accounts").innerHTML = "";

    modalEliminar.style.display = "none";

    console.log("💀 Datos eliminados");
  });

}


