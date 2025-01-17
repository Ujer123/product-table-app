import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ApiResponse {
  code: number;
  data: Product[]; // The 'data' property contains an array of products
  remark: string;
}

interface Product {
  id?: string;
  date: string;
  time: string;
  entity: string;
  task: string;
  person: string;
  notes: string;
  status: string;
  showStatusDropdown?: boolean;
  showActionDropdown?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HttpClientModule, CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchQuery: string = '';  // Single search input field to search all
  // Default filter options
  filterOptions = {
    task: {
      call: false,
      meeting: false,
      videoCall: false,
      all: true,  // Default to "All" for task type
    },
  };
  isFilterDropdownVisible: boolean = false;
  isModalOpen: boolean = false; // Control modal visibility
  newTask: Product = { date: '', time: '', entity: '', task: '', person: '', notes: '', status: '' }; // New task data
  isModalOpenNotes: boolean = false;
  selectedProduct: any;  // Selected product for notes editing
  

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<ApiResponse>('https://task-backend-tfp7.onrender.com/products')
      .subscribe(response => {
        this.products = response.data;
        
        this.filteredProducts = this.products;        
        
      });
  }

   // Open the modal to edit notes for a selected product
   openNotesModal(product: any) {
    this.selectedProduct = product;  // Set the selected product
    this.isModalOpenNotes = true;          // Open the modal
  }


  saveNotes() {
    if (this.selectedProduct && this.selectedProduct._id) {
      // Send a PUT request to update the product notes
      this.http
        .put(
          `https://task-backend-tfp7.onrender.com/products/${this.selectedProduct._id}`,
          { notes: this.selectedProduct.notes }
        )
        .subscribe(
          (response: any) => {
            console.log('Notes updated:', response);
  
            // Update the local product list
            const productToUpdate = this.products.find(
              (product) => product.id === this.selectedProduct.id
            );
  
            if (productToUpdate) {
              productToUpdate.notes = this.selectedProduct.notes;
            }
  
            // Close the modal
            this.isModalOpenNotes = false;
          },
          (error) => {
            console.error('Error saving notes:', error);
          }
        );
    } else {
      console.error('No selected product or missing ID');
    }
  }
  // Close the modal
  closeModalNotes() {
    this.isModalOpenNotes = false;
  }
  toggleFilterDropdown() {
    this.isFilterDropdownVisible = !this.isFilterDropdownVisible;
  }
   // Open the modal to add a new task
   openModal() {
    this.isModalOpen = true;
  }
  // Close the modal without saving
  closeModal() {
    this.isModalOpen = false;
  }
  // Submit the new task to the API
  submitTask() {
    this.http.post('https://task-backend-tfp7.onrender.com/products', this.newTask)
      .subscribe(response => {
        console.log('Task added:', response);
        this.products.push(this.newTask);  // Update local product list
        this.filteredProducts = this.products; // Update filtered products list
        
        this.closeModal(); // Close the modal after submission
      });
  }
  toggleStatusDropdown(product: any) {
    // Close all other dropdowns
    this.filteredProducts.forEach((p) => {
      if (p !== product) {
        p.showStatusDropdown = false;
      }
    });

    // Toggle the current dropdown
    product.showStatusDropdown = !product.showStatusDropdown;
  }

  
  toggleActionDropdown(product: any) {
    // Close all other dropdowns
    this.filteredProducts.forEach((p) => {
      if (p !== product) {
        p.showActionDropdown = false;
      }
    });
  
    // Toggle the current dropdown
    product.showActionDropdown = !product.showActionDropdown;
  }

  submitEditedTask() {
    // Find the index of the product being edited
    const index = this.products.findIndex(
      (product) => product.id === this.selectedProduct.id
    );
  
    // Update the product in the list
    if (index !== -1) {
      this.products[index] = { ...this.newTask };
      this.filteredProducts = [...this.products]; // Update the filtered list
    }
  
    // Close the modal
    this.closeModal();
  }
  toggleStatus(product: any) {
    // Toggle the status between 'Open' and 'Closed'
    const newStatus = product.status === 'Open' ? 'Closed' : 'Open';
  
    // Send a PUT request to update the status in the backend
    this.http
      .put(`https://task-backend-tfp7.onrender.com/products/${product._id}`, { status: newStatus })
      .subscribe(
        (response: any) => {
          console.log('Status updated:', response);
          product.status = newStatus; // Update the status locally
        },
        (error) => {
          console.error('Error updating status:', error);
        }
      );
  }
  
  
  
  editTask(product: any) {
    this.selectedProduct = { ...product }; // Clone the selected product
    this.newTask = { ...product }; // Populate the modal fields with the selected product's data
    this.isModalOpen = true; // Open the modal for editing
  }
  

  duplicateTask(product: any) {
    const duplicatedProduct = { ...product, id: this.generateUniqueId() };
    this.filteredProducts.push(duplicatedProduct);
  }
  deleteTask(product: any) {
    if (product._id) {
      this.http
        .delete(`https://task-backend-tfp7.onrender.com/products/${product._id}`)
        .subscribe(
          () => {
            console.log(`Task with ID ${product._id} deleted successfully.`);
            // Remove the task from the frontend
            this.filteredProducts = this.filteredProducts.filter(
              (p) => p.id !== product._id
            );
            this.products = this.products.filter(
              (p) => p.id !== product._id
            ); // Ensure the main list is also updated
          },
          (error) => {
            console.error('Error deleting task:', error);
          }
        );
    } else {
      console.error('Product ID is missing, unable to delete task.');
    }
  }
  
  
  changeStatus(product: any, newStatus: string) {
    // Update the status in the backend
    this.http
      .put(`https://task-backend-tfp7.onrender.com/products/${product._id}`, { status: newStatus })
      .subscribe(
        (response: any) => {
          console.log('Status updated:', response);
          product.status = newStatus; // Update the status locally
          product.showStatusDropdown = false; // Close the dropdown after status change
        },
        (error) => {
          console.error('Error updating status:', error);
        }
      );
  }
  
  generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  // This method filters the products based on the search query and selected filters
  filterTasks() {
    // If "All" task filter is selected, reset the other task filters
    if (this.filterOptions.task.all) {
      this.filterOptions.task.call = false;
      this.filterOptions.task.meeting = false;
      this.filterOptions.task.videoCall = false;
    }
  
    // Convert search query to lowercase for case-insensitive comparison
    const query = this.searchQuery.toLowerCase();
  
    // Filter the products based on task type and search query
    this.filteredProducts = this.products.filter(product => {
      // Task filter based on selected options
      const taskMatches =
        (this.filterOptions.task.call && product.task === 'Call') ||
        (this.filterOptions.task.meeting && product.task === 'Meeting') ||
        (this.filterOptions.task.videoCall && product.task === 'Video Call') ||
        this.filterOptions.task.all;  // If "All" is selected, include all tasks
  
      // Search query filter for matching any fields
      const searchMatches =
        (product.date && product.date.toLowerCase().includes(query)) ||
        (product.time && product.time.toLowerCase().includes(query)) ||
        (product.entity && product.entity.toLowerCase().includes(query)) ||
        (product.task && product.task.toLowerCase().includes(query)) ||
        (product.person && product.person.toLowerCase().includes(query)) ||
        (product.notes && product.notes.toLowerCase().includes(query)) ||
        (product.status && product.status.toLowerCase().includes(query));
  
      // Combine task filter and search query filter
      return taskMatches && searchMatches;
    });
  }
  
}
