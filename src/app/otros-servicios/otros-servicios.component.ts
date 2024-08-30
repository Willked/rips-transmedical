import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DataGeneralService } from '../data-general.service';
import { NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-otros-servicios',
  templateUrl: './otros-servicios.component.html',
  styleUrls: ['./otros-servicios.component.css']
})
export class OtrosServiciosComponent implements OnInit {
  @Output() sendOtrosServicios = new EventEmitter<any[]>();
  @Output() sendSubtotal = new EventEmitter<any>();

  form: FormGroup = new FormGroup({
    fecha: new FormGroup(""),
    hora: new FormGroup(""),
    tecnologia: new FormGroup(""),
    cantidad: new FormGroup(""),
    valorunit: new FormGroup(""),
    tipoConsulta: new FormGroup('')
  });

  formModal: FormGroup = new FormGroup({
    fechaModal: new FormGroup(""),
    horaModal: new FormGroup(""),
    tecnologiaModal: new FormGroup(""),
    cantidadModal: new FormGroup(""),
    valorunitModal: new FormGroup(""),
    tipoModal: new FormGroup('')
  });

  currentDate = new Date().toISOString().substring(0, 10);
  currentTime = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  otrosArray:any[] = [];
  lastId = 0;
  submitted = false;
  serviciosClinica: any[] = [];
  tecnologia: any[] = [];
  documentoMedico = '';
  tipoDocumentoMedico = '';
  items = 0;
  totalValue = 0;

  constructor(
    private formBuilder: FormBuilder,
    private dataGeneralService: DataGeneralService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      fecha: [this.currentDate, [Validators.required]],
      hora: [this.currentTime, [Validators.required]],
      tecnologia: ['TAB', [Validators.required]],
      cantidad: ['1', [Validators.required, Validators.min(1)]],
      valorunit: ['0', [Validators.required, Validators.min(1)]],
      tipoConsulta: ['311', []]
    });
    this.dataGeneralService.getData().subscribe(data => {
      this.serviciosClinica = data.servicios;
      this.tecnologia = data.tecnologia;
    });
  }

  get f(): { [key: string]: AbstractControl } { return this.form.controls; }
  get g(): { [key: string]: AbstractControl } { return this.formModal.controls; }

  // Busca el médico del procedimiento
  searchMD(cod:number): void {
    this.documentoMedico = "";
    this.tipoDocumentoMedico = "";

    const val = this.serviciosClinica.filter(servicio => servicio.codigo === cod);
    this.documentoMedico = val[0].medico.documento;
    this.tipoDocumentoMedico = val[0].medico.tipoDocumento;
  }

  // Busca un elemento del arreglo de procedimientos por el id
  searchArray(id:number): any { return this.otrosArray.filter(servicio => servicio.id === id) }

  // Busca la tecnología por el id
  searchTech(id:string): void {
    const val = this.tecnologia.filter(servicio => servicio.codigo === id);
    return val[0].nombre;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.lastId++;
    let valorOutput = this.form.value.valorunit*this.form.value.cantidad;

    this.searchMD(this.form.value.tipoConsulta);
    this.totalValue += Number(valorOutput);
    let newService = {
      id: this.lastId,
      fecha: this.form.value.fecha,
      hora: this.form.value.hora,
      tecnologia: this.form.value.tecnologia,
      nomTecnologia: this.searchTech(this.form.value.tecnologia),
      tipoConsulta: this.form.value.tipoConsulta,
      cantidad: this.form.value.cantidad,
      documentoMedico: this.documentoMedico,
      tipoDocumentoMedico: this.tipoDocumentoMedico,
      valorunit: this.form.value.valorunit,
      valor: valorOutput
    };
    this.otrosArray.push(newService);
    this.items= this.otrosArray.length;
    this.sendOtrosServicios.emit(this.otrosArray);
    this.sendSubtotal.emit(this.totalValue);
  }

  onRemove(id:number): void {
    this.submitted = false;
    let tmp = this.searchArray(id);
    this.otrosArray = this.otrosArray.filter(servicio => servicio.id !== id);
    this.items= this.otrosArray.length;
    this.totalValue -= Number(tmp[0].valor);
    this.sendSubtotal.emit(this.totalValue);
  }

  // Abre el modal de edición del procedimiento
  openModal(content:any, id:number): void {
    this.submitted = false;

    this.modalService.open(content);

    let val = this.searchArray(id);

    this.formModal = this.formBuilder.group({
      fechaModal: [val[0].fecha, [Validators.required]],
      horaModal: [val[0].hora, [Validators.required]],
      tecnologiaModal: [val[0].tecnologia, [Validators.required]],
      cantidadModal: [val[0].cantidad, [Validators.required, Validators.min(1)]],
      valorunitModal: [val[0].valorunit, [Validators.required, Validators.min(1)]],
      tipoModal: [val[0].tipoConsulta, []],
      id: [id]
    });
  }

  onEdit(): void {
    this.submitted = true;

    if (this.formModal.invalid) {
      return;
    }

    this.searchMD(this.formModal.value.tipoModal);

    this.otrosArray = this.otrosArray.map(proc => {
      if (proc.id === this.formModal.value.id) {
        this.totalValue -= Number(proc.valor);
        let vrtot = Number(this.formModal.value.valorunitModal)*Number(this.formModal.value.cantidadModal);
        this.totalValue += Number(vrtot);
        return {
          ...proc,
          fecha: this.formModal.value.fechaModal,
          hora: this.formModal.value.horaModal,
          tecnologia: this.formModal.value.tecnologiaModal,
          nomTecnologia: this.searchTech(this.formModal.value.tecnologiaModal),
          cantidad: this.formModal.value.cantidadModal,
          valorunit: this.formModal.value.valorunitModal,
          valor: vrtot,
          documentoMedico: this.documentoMedico,
          tipoDocumentoMedico: this.tipoDocumentoMedico
        }
      }
      return proc;
    });

    this.sendOtrosServicios.emit(this.otrosArray);
    this.sendSubtotal.emit(this.totalValue);

    this.modalService.dismissAll();
  }


}
